"""
Literature Search Service V2 - Enhanced with more sources, better ranking, and user feedback.
"""

import asyncio
import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
from crossref_client import crossref_client
from google_scholar_client import google_scholar_client
from intent_service import parse_query
from literature_service import (
    ArxivClient,
    LiteratureService,
    SemanticScholarClient,
    UnpaywallClient,
)
from openalex_client import openalex_client

logger = logging.getLogger(__name__)


@dataclass
class UserFeedback:
    """User feedback on a paper result."""

    paper_id: str
    query: str
    relevant: bool  # True = thumbs up, False = thumbs down
    timestamp: float = field(default_factory=time.time)


class LiteratureV2Service:
    """
    Enhanced literature search service with:
    - More sources (Google Scholar, Crossref)
    - User feedback learning
    - Streaming results
    - Better relevance through re-ranking
    """

    def __init__(self):
        # Reuse V1 clients
        self.semantic_scholar = SemanticScholarClient()
        self.arxiv = ArxivClient()
        self.unpaywall = UnpaywallClient()

        # New V2 sources
        self.google_scholar = google_scholar_client
        self.crossref = crossref_client
        self.openalex = openalex_client

        # Caching
        self._query_cache: Dict[str, Dict[str, Any]] = {}
        self._paper_cache: Dict[str, Dict[str, Any]] = {}
        self.CACHE_TTL = 24 * 60 * 60  # 24 hours

        # User feedback storage (in production, move to database)
        self._feedback: List[UserFeedback] = []
        self._paper_query_relevance: Dict[str, Dict[str, float]] = defaultdict(dict)

    def _cache_key(self, query: str, **kwargs) -> str:
        """Generate cache key for query."""
        return f"{query}:{hash(str(sorted(kwargs.items())))}"

    def _get_cached(self, key: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached results if not expired."""
        entry = self._query_cache.get(key)
        if not entry:
            return None
        if entry["expires_at"] < time.time():
            del self._query_cache[key]
            return None
        return entry["value"]

    def _set_cached(self, key: str, value: List[Dict[str, Any]]):
        """Cache results."""
        self._query_cache[key] = {
            "value": value,
            "expires_at": time.time() + self.CACHE_TTL,
        }

    async def search_all_sources(
        self,
        query: str,
        intent: Dict[str, Any],
        limit_per_source: int = 25,
        include_scholar: bool = True,
        include_crossref: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Search all available sources in parallel.

        V2 adds Google Scholar and Crossref to V1 sources.
        """
        year_min = intent.get("year_min")

        # Build coroutines for all sources
        coroutines = [
            # V1 sources
            (
                "semantic_scholar",
                self.semantic_scholar.search_papers(query, limit_per_source),
            ),
            ("arxiv", self.arxiv.search_papers(query, limit_per_source)),
            (
                "openalex",
                self.openalex.search_papers(query, limit_per_source, year_min=year_min),
            ),
            # V2 new sources (conditional)
            *(
                [
                    (
                        "google_scholar",
                        self.google_scholar.search_papers(
                            query, limit_per_source, year_min=year_min
                        ),
                    )
                ]
                if include_scholar and self.google_scholar.enabled
                else []
            ),
            *(
                [
                    (
                        "crossref",
                        self.crossref.search_papers(
                            query, limit_per_source, year_min=year_min
                        ),
                    )
                ]
                if include_crossref
                else []
            ),
        ]

        names, tasks = zip(*coroutines) if coroutines else ([], [])
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_papers = []
        source_counts = {}

        for name, result in zip(names, results):
            if isinstance(result, Exception):
                logger.warning(f"Source {name} failed: {result}")
                source_counts[name] = 0
                continue

            papers = result or []
            source_counts[name] = len(papers)
            all_papers.extend(papers)

        logger.info(f"Search sources returned: {source_counts}")
        return all_papers

    def _normalize_doi(self, doi: Optional[str]) -> Optional[str]:
        """Normalize DOI for deduplication."""
        if not doi:
            return None
        return (
            doi.lower()
            .replace("https://doi.org/", "")
            .replace("http://doi.org/", "")
            .strip()
        )

    def _normalize_title(self, title: str) -> str:
        """Normalize title for deduplication."""
        import re

        # Remove punctuation, extra spaces, lowercase
        normalized = re.sub(r"[^\w\s]", "", title.lower())
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized

    def _deduplicate_papers(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Deduplicate papers by DOI (primary) and normalized title (fallback).
        V2 improvement: Keep the paper with most metadata when merging.
        """
        by_doi: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        by_title: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        # Group by identifiers
        for paper in papers:
            doi = self._normalize_doi(paper.get("doi"))
            title = self._normalize_title(paper.get("title", ""))

            if doi:
                by_doi[doi].append(paper)
            elif title:
                by_title[title].append(paper)

        # Merge groups, keeping richest metadata
        def merge_papers(paper_list: List[Dict[str, Any]]) -> Dict[str, Any]:
            if len(paper_list) == 1:
                return paper_list[0]

            # Start with first paper
            merged = dict(paper_list[0])

            # Track sources
            sources = [merged.get("source", "unknown")]

            for other in paper_list[1:]:
                sources.append(other.get("source", "unknown"))

                # Fill in missing fields
                for key in [
                    "abstract",
                    "pdf_url",
                    "open_access_pdf_url",
                    "citation_count",
                    "year",
                ]:
                    if not merged.get(key) and other.get(key):
                        merged[key] = other[key]

                # Combine authors (longest list wins, assuming more complete)
                if len(other.get("authors", [])) > len(merged.get("authors", [])):
                    merged["authors"] = other["authors"]

                # Keep higher citation count
                other_citations = other.get("citation_count") or 0
                merged_citations = merged.get("citation_count") or 0
                if other_citations > merged_citations:
                    merged["citation_count"] = other_citations

            merged["source"] = " + ".join(sorted(set(sources)))
            merged["sources"] = list(set(sources))  # For internal tracking
            return merged

        # Get unique papers
        unique_papers = []
        seen_titles = set()

        for doi, group in by_doi.items():
            merged = merge_papers(group)
            unique_papers.append(merged)
            seen_titles.add(self._normalize_title(merged.get("title", "")))

        for title, group in by_title.items():
            if title not in seen_titles:
                unique_papers.append(merge_papers(group))

        logger.info(
            f"Deduplication: {len(papers)} → {len(unique_papers)} unique papers"
        )
        return unique_papers

    def _calculate_source_diversity_score(self, paper: Dict[str, Any]) -> float:
        """
        V2: Boost papers found in multiple sources (indicates importance/coverage).
        """
        sources = paper.get("sources", [paper.get("source", "unknown")])
        if isinstance(sources, str):
            sources = sources.split(" + ")

        # Count unique major sources
        unique_sources = set()
        for s in sources:
            if " + " in s:
                unique_sources.update(s.split(" + "))
            else:
                unique_sources.add(s)

        # Score: 0.0 for 1 source, up to 0.15 for 4+ sources
        return min(0.15, (len(unique_sources) - 1) * 0.05)

    def _apply_user_feedback_boost(
        self, papers: List[Dict[str, Any]], query: str
    ) -> List[Dict[str, Any]]:
        """
        V2: Re-rank based on historical user feedback for similar queries.
        """
        query_lower = query.lower()

        for paper in papers:
            paper_id = (
                paper.get("external_id") or paper.get("doi") or paper.get("title")
            )

            # Check if we have feedback for this paper on similar queries
            relevance_scores = self._paper_query_relevance.get(paper_id, {})

            boost = 0.0
            for past_query, score in relevance_scores.items():
                # Simple similarity check - could use embeddings in V3
                if any(word in past_query for word in query_lower.split()):
                    boost += score * 0.1  # Max 0.1 boost from feedback

            paper["feedback_boost"] = min(0.1, boost)
            if "final_score" in paper:
                paper["final_score"] = paper["final_score"] + paper["feedback_boost"]

        return papers

    async def rank_papers_v2(
        self,
        papers: List[Dict[str, Any]],
        query: str,
        intent: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        V2 Enhanced ranking with:
        - Source diversity boost
        - User feedback integration
        - Improved citation weighting
        """
        from ranking_service import compute_ranking

        # First, apply V1 ranking
        # Get citation counts from OpenAlex for all papers with DOI
        dois = [self._normalize_doi(p.get("doi")) for p in papers if p.get("doi")]
        citation_counts = {}
        if dois:
            try:
                citation_counts = await self.openalex.get_citation_counts_batch(
                    dois[:300]
                )
            except Exception as e:
                logger.warning(f"Failed to get citation counts: {e}")

        ranked = compute_ranking(papers, intent, citation_counts)

        # V2 enhancements
        for paper in ranked:
            # Add source diversity score
            paper["source_diversity_score"] = self._calculate_source_diversity_score(
                paper
            )
            if "final_score" in paper:
                paper["final_score"] += paper["source_diversity_score"]

            # Add V2 flag for UI
            paper["v2_enhanced"] = True

        # Apply user feedback boosts
        ranked = self._apply_user_feedback_boost(ranked, query)

        # Re-sort by final score
        ranked.sort(key=lambda x: x.get("final_score", 0), reverse=True)

        return ranked

    async def search(
        self,
        query: str,
        limit: int = 20,
        use_cache: bool = True,
        include_scholar: bool = True,
        include_crossref: bool = True,
    ) -> Dict[str, Any]:
        """
        Main search method for V2.

        Returns:
            Dict with papers, timing, sources used, and metadata
        """
        started = time.perf_counter()

        # Check cache
        cache_key = self._cache_key(
            query,
            limit=limit,
            include_scholar=include_scholar,
            include_crossref=include_crossref,
        )
        if use_cache:
            cached = self._get_cached(cache_key)
            if cached:
                return {
                    "query": query,
                    "papers": cached[:limit],
                    "total_found": len(cached),
                    "from_cache": True,
                    "sources": ["cached"],
                    "timing_ms": 0,
                }

        # Parse intent
        intent_start = time.perf_counter()
        intent = await parse_query(query)
        intent_ms = int((time.perf_counter() - intent_start) * 1000)

        # Search all sources
        search_start = time.perf_counter()
        all_papers = await self.search_all_sources(
            query,
            intent,
            limit_per_source=30,
            include_scholar=include_scholar,
            include_crossref=include_crossref,
        )
        search_ms = int((time.perf_counter() - search_start) * 1000)

        # Deduplicate
        dedup_start = time.perf_counter()
        unique_papers = self._deduplicate_papers(all_papers)
        dedup_ms = int((time.perf_counter() - dedup_start) * 1000)

        # Rank
        rank_start = time.perf_counter()
        ranked = await self.rank_papers_v2(unique_papers, query, intent)
        rank_ms = int((time.perf_counter() - rank_start) * 1000)

        # Enrich top papers with Unpaywall
        enrich_start = time.perf_counter()
        top_papers = ranked[:limit]

        # Parallel Unpaywall lookups for top papers
        async def enrich_paper(paper: Dict[str, Any]) -> Dict[str, Any]:
            doi = paper.get("doi")
            if not doi:
                return paper
            try:
                oa = await self.unpaywall.find_open_access(doi)
                if oa and oa.get("oa_url"):
                    paper["open_access_pdf_url"] = oa["oa_url"]
            except Exception:
                pass
            return paper

        # Enrich with concurrency limit
        semaphore = asyncio.Semaphore(5)

        async def bounded_enrich(paper):
            async with semaphore:
                return await enrich_paper(paper)

        top_papers = await asyncio.gather(*[bounded_enrich(p) for p in top_papers])
        enrich_ms = int((time.perf_counter() - enrich_start) * 1000)

        total_ms = int((time.perf_counter() - started) * 1000)

        # Cache results
        self._set_cached(cache_key, ranked)

        # Determine which sources were actually used
        sources_used = set()
        for p in unique_papers[:100]:
            src = p.get("source", "")
            if " + " in src:
                sources_used.update(src.split(" + "))
            else:
                sources_used.add(src)

        return {
            "query": query,
            "papers": top_papers,
            "intent": intent,
            "total_found": len(unique_papers),
            "from_cache": False,
            "sources": sorted(sources_used),
            "timing": {
                "intent_ms": intent_ms,
                "search_ms": search_ms,
                "dedup_ms": dedup_ms,
                "rank_ms": rank_ms,
                "enrich_ms": enrich_ms,
                "total_ms": total_ms,
            },
        }

    def add_feedback(self, paper_id: str, query: str, relevant: bool):
        """
        Record user feedback on a paper result.

        Args:
            paper_id: The paper's external_id or DOI
            query: The search query
            relevant: True if user indicated this was relevant
        """
        feedback = UserFeedback(paper_id=paper_id, query=query, relevant=relevant)
        self._feedback.append(feedback)

        # Update running relevance score for this paper-query pair
        # Score is average of feedback (-1 for thumbs down, +1 for thumbs up)
        query_lower = query.lower()
        current_score = self._paper_query_relevance[paper_id].get(query_lower, 0)

        # Simple moving average
        new_score = 1.0 if relevant else -1.0
        self._paper_query_relevance[paper_id][query_lower] = (
            current_score * 0.7 + new_score * 0.3
        )

        logger.info(
            f"Feedback recorded: {paper_id} for '{query}' -> {'relevant' if relevant else 'not relevant'}"
        )

    async def get_similar_papers(
        self, paper_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        V2 Feature: Find papers similar to a given paper.
        Uses title + abstract similarity search.
        """
        # First, get the paper details
        # Try OpenAlex by DOI or ID
        paper = None

        # Try to find in cache/recent results
        # In production, this would query the database

        if not paper:
            logger.warning(
                f"Cannot find similar papers - original paper {paper_id} not found"
            )
            return []

        # Use title + abstract as query
        query = f"{paper.get('title', '')} {paper.get('abstract', '')}"[:200]

        # Search with higher similarity threshold
        result = await self.search(query, limit=limit * 2)

        # Filter out the original paper
        similar = [
            p
            for p in result["papers"]
            if p.get("external_id") != paper_id and p.get("doi") != paper_id
        ][:limit]

        return similar

    async def close(self):
        await self.semantic_scholar.close()
        await self.arxiv.close()
        await self.unpaywall.close()
        await self.google_scholar.close()
        await self.crossref.close()


# Singleton instance
literature_v2_service = LiteratureV2Service()
