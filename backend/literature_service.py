"""
Literature Search Service - Semantic Scholar, arXiv, and OpenAlex integration.
"""
import httpx
import asyncio
import logging
import os
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Import lazily to avoid circular import issues at module load time.
# openalex_client is used in retrieve_lexical as a third retrieval source.
def _get_openalex_client():
    from openalex_client import openalex_client
    return openalex_client


class SemanticScholarClient:
    """Client for Semantic Scholar API."""

    BASE_URL = "https://api.semanticscholar.org/graph/v1"

    def __init__(self):
        self.api_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY")
        self.client = httpx.AsyncClient(timeout=30.0)
        self._last_request_time = 0
        # Authenticated tier: 10 req/s; anonymous: 1 req/s.
        # Use 0.15s interval with key (≈6 req/s, safely under the 10 req/s limit).
        self._min_request_interval = 0.15 if self.api_key else 1.0
        self._rate_lock = asyncio.Lock()
    
    async def _rate_limit(self):
        """Serialize SS requests and enforce minimum interval between them."""
        async with self._rate_lock:
            import time
            now = time.time()
            elapsed = now - self._last_request_time
            if elapsed < self._min_request_interval:
                await asyncio.sleep(self._min_request_interval - elapsed)
            self._last_request_time = time.time()
    
    def _extract_doi(self, paper: Dict[str, Any]) -> Optional[str]:
        """Extract DOI from Semantic Scholar paper metadata."""
        # Primary: externalIds (most reliable; DOI field was removed from SS API)
        ext_ids = paper.get("externalIds") or {}
        if isinstance(ext_ids, dict) and ext_ids.get("DOI"):
            return ext_ids["DOI"]

        # Try direct DOI field (kept for backwards compat / other sources)
        if "doi" in paper and paper["doi"]:
            return paper["doi"]

        # Try to extract from URL
        url = paper.get("url", "")
        if "doi.org" in url:
            return url.split("doi.org/")[-1]

        # Try citation styles (Semantic Scholar provides formatted citations)
        citation_styles = paper.get("citationStyles", {})
        if citation_styles and isinstance(citation_styles, dict):
            doi_style = citation_styles.get("doi", "")
            if doi_style and "doi.org" in doi_style:
                return doi_style.split("doi.org/")[-1]

        return None

    async def search_papers(
        self,
        query: str,
        limit: int = 20,
        fields: Optional[List[str]] = None,
        study_fields: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Search for papers on Semantic Scholar.

        Args:
            query: Search query string.
            limit: Maximum number of results.
            fields: Semantic Scholar response field selectors (what data to return).
            study_fields: Academic discipline filter passed as `fieldsOfStudy` to the
                Semantic Scholar API (e.g. ["Medicine", "Psychology"]). When provided,
                only papers in those disciplines are returned, which significantly
                reduces irrelevant results for domain-specific queries.
        """
        if fields is None:
            fields = [
                "paperId", "title", "abstract", "authors", "year",
                "citationCount", "url", "openAccessPdf", "citationStyles",
                "references", "externalIds"
            ]

        await self._rate_limit()

        # Prepare headers with API key if available
        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key

        params: Dict[str, Any] = {
            "query": query,
            "limit": limit,
            "fields": ",".join(fields),
        }
        if study_fields:
            params["fieldsOfStudy"] = ",".join(study_fields)

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/paper/search",
                params=params,
                headers=headers,
            )

            # Handle rate limiting
            if response.status_code == 429:
                logger.warning("Semantic Scholar rate limited, waiting...")
                await asyncio.sleep(5)
                return []

            response.raise_for_status()
            data = response.json()

            papers = []
            for paper in data.get("data", []):
                # Get references for citation network
                refs = paper.get("references", []) or []
                reference_ids = [r.get("paperId") for r in refs if r.get("paperId")]

                # Extract DOI
                doi = self._extract_doi(paper)

                papers.append({
                    "external_id": paper.get("paperId"),
                    "source": "semantic_scholar",
                    "title": paper.get("title", ""),
                    "authors": [a.get("name", "") for a in paper.get("authors", [])],
                    "abstract": paper.get("abstract"),
                    "year": paper.get("year"),
                    "citation_count": paper.get("citationCount"),
                    "url": paper.get("url"),
                    "pdf_url": paper.get("openAccessPdf", {}).get("url") if paper.get("openAccessPdf") else None,
                    "doi": doi,
                    "reference_ids": reference_ids[:20]  # Limit references stored
                })
            
            return papers
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning("Semantic Scholar rate limited")
                return []
            logger.error(f"Semantic Scholar search error: {e}")
            return []
        except Exception as e:
            logger.error(f"Semantic Scholar search error: {e}")
            return []
    
    async def close(self):
        await self.client.aclose()


class ArxivClient:
    """Client for arXiv API."""
    
    BASE_URL = "https://export.arxiv.org/api/query"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=12.0, follow_redirects=True)
    
    async def search_papers(
        self,
        query: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search for papers on arXiv."""
        try:
            # arXiv uses a specific query format
            search_query = f"all:{query}"
            
            response = await self.client.get(
                self.BASE_URL,
                params={
                    "search_query": search_query,
                    "start": 0,
                    "max_results": limit,
                    "sortBy": "relevance"
                }
            )
            response.raise_for_status()
            
            # Parse XML response
            root = ET.fromstring(response.text)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            
            papers = []
            for entry in root.findall("atom:entry", ns):
                # Get authors
                authors = []
                for author in entry.findall("atom:author", ns):
                    name = author.find("atom:name", ns)
                    if name is not None:
                        authors.append(name.text)
                
                # Get PDF link
                pdf_url = None
                for link in entry.findall("atom:link", ns):
                    if link.get("title") == "pdf":
                        pdf_url = link.get("href")
                        break
                
                # Get ID
                arxiv_id = entry.find("atom:id", ns)
                arxiv_id_text = arxiv_id.text if arxiv_id is not None else ""
                
                # Extract year from published date
                published = entry.find("atom:published", ns)
                year = None
                if published is not None and published.text:
                    try:
                        year = int(published.text[:4])
                    except (ValueError, IndexError):
                        pass
                
                title_elem = entry.find("atom:title", ns)
                abstract_elem = entry.find("atom:summary", ns)
                
                papers.append({
                    "external_id": arxiv_id_text.split("/abs/")[-1] if arxiv_id_text else None,
                    "source": "arxiv",
                    "title": title_elem.text.strip().replace("\n", " ") if title_elem is not None else "",
                    "authors": authors,
                    "abstract": abstract_elem.text.strip() if abstract_elem is not None else None,
                    "year": year,
                    "citation_count": None,
                    "url": arxiv_id_text,
                    "pdf_url": pdf_url
                })
            
            return papers
        except Exception as e:
            logger.error(f"arXiv search error: {e}")
            return []
    
    async def close(self):
        await self.client.aclose()


class UnpaywallClient:
    """Client for Unpaywall API to find open access versions of papers."""

    BASE_URL = "https://api.unpaywall.org/v2"

    def __init__(self):
        self.email = os.environ.get("UNPAYWALL_EMAIL")
        self.client = httpx.AsyncClient(timeout=30.0)

        if not self.email:
            logger.warning("UNPAYWALL_EMAIL not configured. Unpaywall requests may be limited.")

    async def find_open_access(self, doi: str) -> Optional[Dict[str, Any]]:
        """Find open access version of a paper by DOI."""
        if not doi:
            return None

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/{doi}",
                params={
                    "email": self.email
                }
            )

            if response.status_code == 404:
                return None

            response.raise_for_status()
            data = response.json()

            # Check if open access version is available
            if not data.get("is_oa"):
                return None

            oa_location = data.get("best_oa_location")
            if not oa_location:
                return None

            return {
                "doi": doi,
                "oa_url": oa_location.get("url"),
                "oa_type": oa_location.get("type"),  # "publisher", "repository", etc.
                "version": oa_location.get("version"),  # "published", "accepted", etc.
                "license": data.get("oa_license"),
                "title": data.get("title")
            }

        except Exception as e:
            logger.error(f"Unpaywall lookup error for DOI {doi}: {e}")
            return None

    async def close(self):
        await self.client.aclose()


class CoreApiClient:
    """Client for CORE API — broad open-access literature aggregator covering 300M+ papers."""

    BASE_URL = "https://api.core.ac.uk/v3"

    def __init__(self):
        self.api_key = os.environ.get("CORE_API_KEY")
        # follow_redirects=False so the Authorization header is never stripped on redirect.
        # We use the canonical URL (with trailing slash) to avoid the redirect entirely.
        self.client = httpx.AsyncClient(timeout=20.0)
        if not self.api_key:
            logger.warning("CORE_API_KEY not configured. CORE search disabled.")

    async def search_papers(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/search/works/",
                params={"q": query, "limit": limit, "offset": 0},
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            if response.status_code == 429:
                logger.warning("CORE API rate limited")
                return []
            if response.status_code != 200:
                logger.debug(f"CORE search returned {response.status_code} for '{query}'")
                return []
            results = response.json().get("results") or []
            papers: List[Dict[str, Any]] = []
            for item in results:
                title = (item.get("title") or "").strip()
                if not title:
                    continue
                year = item.get("yearPublished")
                doi = None
                for id_entry in (item.get("identifiers") or []):
                    if isinstance(id_entry, str) and id_entry.startswith("doi:"):
                        doi = id_entry[4:].strip()
                        break
                    if isinstance(id_entry, dict) and id_entry.get("identifier", "").startswith("doi:"):
                        doi = id_entry["identifier"][4:].strip()
                        break
                authors = []
                for a in (item.get("authors") or []):
                    name = a.get("name") if isinstance(a, dict) else str(a)
                    if name:
                        authors.append(name)
                papers.append({
                    "external_id": str(item.get("id") or ""),
                    "source": "core",
                    "title": title,
                    "authors": authors,
                    "abstract": item.get("abstract") or None,
                    "year": int(year) if year else None,
                    "citation_count": None,
                    "url": item.get("links", [{}])[0].get("url") if item.get("links") else None,
                    "pdf_url": item.get("downloadUrl") or None,
                    "doi": doi,
                    "reference_ids": [],
                })
            return papers
        except Exception as e:
            logger.debug(f"CORE search failed for '{query}': {e}")
            return []

    async def close(self):
        await self.client.aclose()


class SpringerNatureClient:
    """Client for Springer Nature Open Access API (free tier, no subscription needed)."""

    BASE_URL = "https://api.springernature.com/openaccess/json"

    def __init__(self):
        self.api_key = os.environ.get("SPRINGER_NATURE_API_KEY")
        self.client = httpx.AsyncClient(timeout=20.0, follow_redirects=True)
        self._key_invalid = False
        if not self.api_key:
            logger.warning("SPRINGER_NATURE_API_KEY not configured. Springer search disabled.")

    async def search_papers(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.api_key or self._key_invalid:
            return []
        try:
            response = await self.client.get(
                self.BASE_URL,
                params={"q": query, "p": min(limit, 50), "api_key": self.api_key},
            )
            if response.status_code == 401 or response.status_code == 403:
                logger.warning(f"Springer Nature API key invalid (HTTP {response.status_code}). Disabling Springer search.")
                self._key_invalid = True
                return []
            if response.status_code == 429:
                logger.warning("Springer Nature API rate limited")
                return []
            if response.status_code != 200:
                logger.warning(f"Springer search returned {response.status_code} for '{query}'")
                return []
            records = response.json().get("records") or []
            papers: List[Dict[str, Any]] = []
            for rec in records:
                title = (rec.get("title") or "").strip()
                if not title:
                    continue
                year = None
                pub_date = rec.get("publicationDate") or rec.get("onlineDate") or ""
                if pub_date:
                    try:
                        year = int(pub_date[:4])
                    except (ValueError, IndexError):
                        pass
                authors = [c.get("creator", "") for c in (rec.get("creators") or []) if c.get("creator")]
                doi = (rec.get("doi") or "").strip() or None
                url = f"https://doi.org/{doi}" if doi else (rec.get("url", [{}])[0].get("value") if rec.get("url") else None)
                papers.append({
                    "external_id": doi or title[:64],
                    "source": "springer",
                    "title": title,
                    "authors": authors,
                    "abstract": rec.get("abstract") or None,
                    "year": year,
                    "citation_count": None,
                    "url": url,
                    "pdf_url": None,
                    "doi": doi,
                    "reference_ids": [],
                })
            return papers
        except Exception as e:
            logger.debug(f"Springer Nature search failed for '{query}': {e}")
            return []

    async def close(self):
        await self.client.aclose()


class LiteratureService:
    """Combined literature search service."""

    QUERY_CACHE_TTL_SECONDS = 24 * 60 * 60
    PHASE1_POOL_SIZE = 500
    PHASE2_POOL_SIZE = 800

    def __init__(self):
        self.semantic_scholar = SemanticScholarClient()
        self.arxiv = ArxivClient()
        self.unpaywall = UnpaywallClient()
        self.core = CoreApiClient()
        self.springer = SpringerNatureClient()
        self._query_cache: Dict[str, Dict[str, Any]] = {}
        self._paper_cache: Dict[str, Dict[str, Any]] = {}
        self._citation_expansion_cache: Dict[str, Dict[str, Any]] = {}

    def _cache_get(self, cache: Dict[str, Dict[str, Any]], key: str):
        entry = cache.get(key)
        if not entry:
            return None
        if entry["expires_at"] < time.time():
            cache.pop(key, None)
            return None
        return entry["value"]

    def _cache_set(self, cache: Dict[str, Dict[str, Any]], key: str, value: Any, ttl_seconds: int):
        cache[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds,
        }

    async def retrieve_lexical(self, query: str, intent: Dict[str, Any], target: int) -> List[Dict[str, Any]]:
        """Lexical retrieval path (BM25-like source retrieval via provider ranking)."""
        expanded_terms = intent.get("expanded_query_terms") or intent.get("expanded_terms") or []
        domain_constraints = intent.get("domain_constraints") or []

        query_terms = [query.strip()]
        query_terms.extend([str(term).strip() for term in expanded_terms[:4] if str(term).strip()])
        query_terms.extend([str(term).strip() for term in domain_constraints[:2] if str(term).strip()])

        unique_queries = []
        seen = set()
        for term in query_terms:
            lower = term.lower()
            if lower not in seen:
                seen.add(lower)
                unique_queries.append(term)

        per_query = max(20, int(target / max(len(unique_queries), 1) / 2))

        papers: List[Dict[str, Any]] = []
        seen_titles = set()

        # Semantic Scholar + arXiv: fan out ALL expanded queries concurrently.
        # SS is capped at 3 queries to avoid burst rate-limiting; arXiv covers all terms.
        ss_queries = unique_queries[:3]
        ss_arxiv_coros = []
        for term in unique_queries:
            if term in ss_queries:
                ss_arxiv_coros.append(self.semantic_scholar.search_papers(term, per_query))
            ss_arxiv_coros.append(self.arxiv.search_papers(term, per_query))

        all_results = await asyncio.gather(*ss_arxiv_coros, return_exceptions=True)
        for result in all_results:
            if isinstance(result, Exception):
                logger.debug(f"Lexical SS/arXiv retrieval failed: {result}")
                continue
            for paper in result:
                title = (paper.get("title") or "").strip().lower()
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)
                papers.append(paper)
                if len(papers) >= target:
                    break

        # OpenAlex: add once for the primary query only.
        # OpenAlex has strong public-health/epidemiology coverage and supports
        # relevance-sorted full-text search with publication-year filtering.
        year_min = intent.get("year_min")
        openalex_limit = min(per_query * 2, 50)
        core_topic = str(intent.get("core_topic") or "").strip()

        # Build OpenAlex queries: primary query + core_topic (if different).
        oa_queries: List[str] = [unique_queries[0]]
        if core_topic and core_topic.lower() != unique_queries[0].lower():
            oa_queries.append(core_topic)

        # Fan out to OpenAlex, CORE, and Springer Nature concurrently for the primary query.
        supplemental_coroutines = [
            *[_get_openalex_client().search_papers(
                q, limit=openalex_limit, year_min=int(year_min) if year_min else None
              ) for q in oa_queries],
            self.core.search_papers(unique_queries[0], limit=min(per_query, 25)),
            self.springer.search_papers(unique_queries[0], limit=min(per_query, 25)),
        ]

        try:
            supplemental_results = await asyncio.gather(*supplemental_coroutines, return_exceptions=True)
            for result in supplemental_results:
                if isinstance(result, Exception):
                    logger.debug(f"Supplemental retrieval failed: {result}")
                    continue
                for paper in result:
                    title = (paper.get("title") or "").strip().lower()
                    if not title or title in seen_titles:
                        continue
                    seen_titles.add(title)
                    papers.append(paper)
                    if len(papers) >= target:
                        break
        except Exception as e:
            logger.debug(f"Supplemental retrieval failed: {e}")

        return papers

    async def retrieve_dense(self, query: str, intent: Dict[str, Any], target: int) -> List[Dict[str, Any]]:
        """
        Dense retrieval path (v1 approximation): semantic term expansion over attributes/core topic.
        Kept deterministic and API-backed without requiring vector DB.
        """
        core_topic = str(intent.get("core_topic") or query).strip()
        method_preferences = [str(item).strip() for item in (intent.get("method_preferences") or []) if str(item).strip()]
        paper_types = [str(item).strip() for item in (intent.get("paper_type_preference") or []) if str(item).strip()]

        semantic_queries = [core_topic]
        semantic_queries.extend(method_preferences[:3])
        semantic_queries.extend(paper_types[:2])

        unique_queries = []
        seen = set()
        for term in semantic_queries:
            lower = term.lower()
            if lower not in seen:
                seen.add(lower)
                unique_queries.append(term)

        per_query = max(20, int(target / max(len(unique_queries), 1) / 2))
        papers: List[Dict[str, Any]] = []
        seen_titles = set()

        # Fan out all dense SS+arXiv queries concurrently.
        # SS is used only for the primary term; arXiv covers all for breadth.
        ss_primary = unique_queries[:1]
        dense_coros = []
        for term in unique_queries:
            if term in ss_primary:
                dense_coros.append(self.semantic_scholar.search_papers(term, per_query))
            dense_coros.append(self.arxiv.search_papers(term, per_query))

        dense_results = await asyncio.gather(*dense_coros, return_exceptions=True)
        for result in dense_results:
            if isinstance(result, Exception):
                logger.debug(f"Dense retrieval failed: {result}")
                continue
            for paper in result:
                title = (paper.get("title") or "").strip().lower()
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)
                papers.append(paper)
                if len(papers) >= target:
                    break
        return papers

    async def expand_local_citation_graph(self, seed_papers: List[Dict[str, Any]], max_expansion_nodes: int = 300) -> List[Dict[str, Any]]:
        """
        Local-only one-hop expansion using seed references.
        Uses existing source search as bounded proxy for references/citers/co-citations.
        """
        if not seed_papers:
            return []

        reference_terms = []
        for paper in seed_papers[:50]:
            refs = paper.get("reference_ids") or []
            if refs:
                reference_terms.extend([str(ref) for ref in refs[:4]])
            title = (paper.get("title") or "").strip()
            if title:
                reference_terms.append(title)

        unique_terms = []
        seen = set()
        for term in reference_terms:
            normalized = term.strip().lower()
            if normalized and normalized not in seen:
                seen.add(normalized)
                unique_terms.append(term)

        per_query = 8
        expanded: List[Dict[str, Any]] = []
        seen_titles = set()

        for term in unique_terms[:80]:
            results = await asyncio.gather(
                self.semantic_scholar.search_papers(term, per_query),
                return_exceptions=True,
            )
            for result in results:
                if isinstance(result, Exception):
                    continue
                for paper in result:
                    title = (paper.get("title") or "").strip().lower()
                    if not title or title in seen_titles:
                        continue
                    seen_titles.add(title)
                    expanded.append(paper)
                    if len(expanded) >= max_expansion_nodes:
                        return expanded
        return expanded

    async def build_candidate_pool(self, query: str, intent: Dict[str, Any], phase: int = 1) -> List[Dict[str, Any]]:
        """Build candidate pool using lexical + dense + optional local citation expansion."""
        phase = 2 if phase == 2 else 1
        target_size = self.PHASE2_POOL_SIZE if phase == 2 else self.PHASE1_POOL_SIZE
        cache_key = f"pool:{phase}:{hash((query, str(intent.get('core_topic')), tuple(intent.get('expanded_query_terms') or []), intent.get('novelty_mode')))}"
        cached = self._cache_get(self._query_cache, cache_key)
        if cached is not None:
            return cached

        lexical_target = int(target_size * 0.45)
        dense_target = int(target_size * 0.45)

        lexical, dense = await asyncio.gather(
            self.retrieve_lexical(query, intent, lexical_target),
            self.retrieve_dense(query, intent, dense_target),
        )

        merged: List[Dict[str, Any]] = []
        seen_keys = set()

        def paper_key(paper: Dict[str, Any]):
            doi = (paper.get("doi") or "").strip().lower()
            if doi:
                return f"doi:{doi}"
            title = (paper.get("title") or "").strip().lower()
            return f"title:{title}"

        for paper in lexical + dense:
            key = paper_key(paper)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            merged.append(paper)
            if len(merged) >= target_size:
                break

        if phase == 2 and len(merged) < target_size:
            expansion_cache_key = f"expand:{hash(tuple((paper.get('external_id') or paper.get('title') or '') for paper in merged[:50]))}"
            expanded = self._cache_get(self._citation_expansion_cache, expansion_cache_key)
            if expanded is None:
                expanded = await self.expand_local_citation_graph(merged[:50], max_expansion_nodes=300)
                self._cache_set(self._citation_expansion_cache, expansion_cache_key, expanded, self.QUERY_CACHE_TTL_SECONDS)
            for paper in expanded:
                key = paper_key(paper)
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                merged.append(paper)
                if len(merged) >= target_size:
                    break

        merged = merged[:target_size]
        self._cache_set(self._query_cache, cache_key, merged, self.QUERY_CACHE_TTL_SECONDS)
        return merged
    
    async def search_all(
        self,
        query: str,
        limit_per_source: int = 15
    ) -> List[Dict[str, Any]]:
        """Search all literature sources concurrently."""
        # Run searches concurrently
        results = await asyncio.gather(
            self.semantic_scholar.search_papers(query, limit_per_source),
            self.arxiv.search_papers(query, limit_per_source),
            return_exceptions=True
        )

        papers = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Search error: {result}")
                continue
            papers.extend(result)

        # Deduplicate by title (simple approach)
        seen_titles = set()
        unique_papers = []
        for paper in papers:
            title_lower = paper.get("title", "").lower()
            if title_lower not in seen_titles:
                seen_titles.add(title_lower)
                unique_papers.append(paper)

        return unique_papers

    async def search_all_expanded(
        self,
        query: str,
        intent: Dict[str, Any],
        max_candidates: int = 300,
        limit_per_source_per_query: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Intent-aware broad retrieval: run primary query plus expanded terms,
        merge and dedupe, return up to max_candidates for downstream ranking.
        """
        phase = 2 if max_candidates > self.PHASE1_POOL_SIZE else 1
        candidates = await self.build_candidate_pool(query, intent, phase=phase)
        return candidates[:max_candidates]

    async def enrich_with_open_access(
        self,
        papers: List[Dict[str, Any]],
        preserve_order: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Enrich papers with open access PDF URLs from Unpaywall.

        When preserve_order=True the input ranking is preserved and the final
        priority sort is skipped (use this when enriching pre-ranked results).

        For papers with DOIs, queries Unpaywall API to find free versions.
        Adds open_access_pdf_url field if found.

        Sorts results by:
        1. Has open-access PDF (first priority)
        2. Citation count (descending, second priority)
        3. Year (descending, third priority)

        Args:
            papers: List of paper dictionaries

        Returns:
            Enriched and sorted list of papers
        """
        if not papers:
            return []

        # Collect papers with DOIs
        papers_with_doi = [p for p in papers if p.get("doi")]

        if not papers_with_doi:
            logger.info("No papers with DOIs found, skipping Unpaywall enrichment")
            # Still sort by priority even without enrichment
            return self._sort_papers_by_priority(papers)

        logger.info(f"Looking up open access for {len(papers_with_doi)} papers via Unpaywall...")

        # Parallel Unpaywall lookups with rate limiting
        async def lookup_paper(paper):
            doi = paper.get("doi")
            if not doi:
                return paper

            try:
                # Rate limiting: small delay between requests
                await asyncio.sleep(0.1)

                oa_result = await self.unpaywall.find_open_access(doi)
                if oa_result and oa_result.get("oa_url"):
                    paper["open_access_pdf_url"] = oa_result["oa_url"]
                    logger.debug(f"Found OA PDF for DOI {doi}: {oa_result['oa_url']}")
                else:
                    logger.debug(f"No OA PDF found for DOI {doi}")

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    logger.warning(f"Unpaywall rate limited for DOI {doi}")
                else:
                    logger.warning(f"Unpaywall lookup failed for DOI {doi}: {e}")
            except Exception as e:
                logger.warning(f"Unpaywall lookup failed for DOI {doi}: {e}")
                # Don't fail the entire search if Unpaywall is down

            return paper

        # Process lookups in parallel with concurrency limit
        semaphore = asyncio.Semaphore(5)  # Max 5 concurrent Unpaywall requests

        async def bounded_lookup(paper):
            async with semaphore:
                return await lookup_paper(paper)

        enriched_papers = await asyncio.gather(
            *[bounded_lookup(paper) for paper in papers_with_doi],
            return_exceptions=True
        )

        # Handle exceptions and merge back with papers without DOIs
        result = []
        enriched_map = {
            p["external_id"]: p
            for p in enriched_papers
            if not isinstance(p, Exception) and p.get("external_id")
        }

        for paper in papers:
            if paper.get("doi") and paper.get("external_id") in enriched_map:
                result.append(enriched_map[paper["external_id"]])
            else:
                result.append(paper)

        oa_count = sum(1 for p in result if p.get("open_access_pdf_url"))
        logger.info(f"Unpaywall enrichment complete: {oa_count}/{len(papers)} papers have OA PDFs")

        # Sort by priority (skip when preserve_order=True to keep caller's ranking)
        if preserve_order:
            return result
        return self._sort_papers_by_priority(result)

    def _sort_papers_by_priority(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sort papers by priority:
        1. Has open-access PDF or any PDF (first priority)
        2. Citation count (descending, second priority)
        3. Year (descending, third priority)
        """
        def sort_key(paper):
            has_pdf = 1 if paper.get("open_access_pdf_url") or paper.get("pdf_url") else 0
            citations = paper.get("citation_count") or 0
            year = paper.get("year") or 0
            return (-has_pdf, -citations, -year)  # Negative for descending

        return sorted(papers, key=sort_key)

    async def close(self):
        await self.semantic_scholar.close()
        await self.arxiv.close()
        await self.unpaywall.close()


# Singleton instance
literature_service = LiteratureService()
