"""
OpenAlex client for citation counts, paper retrieval, and (optional) citation graph.
Used for citation_signal in ranking (PRD). No API key required; optional email for rate limits.

OpenAlex has broader coverage of public-health, epidemiology, sociology, and medicine literature
than Semantic Scholar, making it a valuable second retrieval source for interdisciplinary queries.
"""
import logging
import os
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


def _reconstruct_abstract(inverted_index: Optional[Dict[str, List[int]]]) -> str:
    """Reconstruct plain-text abstract from OpenAlex inverted index format."""
    if not inverted_index:
        return ""
    word_positions: List[tuple] = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    word_positions.sort(key=lambda x: x[0])
    return " ".join(word for _, word in word_positions)


class OpenAlexClient:
    BASE = "https://api.openalex.org"

    def __init__(self):
        # OpenAlex doesn't use API keys; a mailto improves rate limits.
        # Accept OPENALEX_EMAIL or fall back to UNPAYWALL_EMAIL (same owner).
        self.email = (
            os.environ.get("OPENALEX_EMAIL")
            or os.environ.get("UNPAYWALL_EMAIL")
        )
        self.api_key = os.environ.get("OPENALEX_API_KEY")
        self._client = httpx.AsyncClient(timeout=20.0)

    def _params(self) -> dict:
        params: Dict[str, Any] = {}
        if self.email:
            params["mailto"] = self.email
        if self.api_key:
            params["api_key"] = self.api_key
        return params

    async def search_papers(
        self,
        query: str,
        limit: int = 20,
        year_min: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Paper search via OpenAlex /works endpoint.

        Uses `title_and_abstract.search` filter (not full-text `search`) so results
        must match the query terms in the title or abstract, not just in citations or
        body text.  This gives much better precision for domain-specific queries.

        OpenAlex is particularly strong for public health, epidemiology, medicine,
        sociology, and economics literature — domains where Semantic Scholar's
        CS-heavy indexing is less representative.

        Args:
            query: Search query string. For best results, pass a focused phrase.
            limit: Max number of papers to return (capped at 200 by OpenAlex).
            year_min: If provided, filter results to publication_year >= year_min.
        """
        try:
            # title_and_abstract.search requires the terms to appear in title or
            # abstract, which dramatically improves precision over full-text search.
            filters = [f"title_and_abstract.search:{query}"]
            if year_min:
                filters.append(f"publication_year:>{year_min - 1}")
            params: Dict[str, Any] = {
                **self._params(),
                "filter": ",".join(filters),
                "per-page": min(limit, 200),
                "sort": "relevance_score:desc",
                "select": (
                    "id,title,abstract_inverted_index,authorships,"
                    "publication_year,cited_by_count,doi,primary_location,open_access"
                ),
            }
            r = await self._client.get(f"{self.BASE}/works", params=params)
            if r.status_code == 429:
                logger.warning("OpenAlex rate limited during paper search")
                return []
            if r.status_code != 200:
                logger.debug(f"OpenAlex search returned {r.status_code} for '{query}'")
                return []
            data = r.json()
            results = data.get("results") or []
            papers: List[Dict[str, Any]] = []
            for work in results:
                title = (work.get("title") or "").strip()
                if not title:
                    continue
                abstract = _reconstruct_abstract(work.get("abstract_inverted_index"))
                authors: List[str] = []
                for authorship in (work.get("authorships") or []):
                    author_obj = authorship.get("author") or {}
                    name = author_obj.get("display_name") or ""
                    if name:
                        authors.append(name)
                doi_raw = work.get("doi") or ""
                doi = doi_raw.replace("https://doi.org/", "").strip() or None
                url = f"https://doi.org/{doi}" if doi else (work.get("id") or "")
                oa = work.get("open_access") or {}
                pdf_url = oa.get("oa_url") or None
                if not pdf_url:
                    loc = work.get("primary_location") or {}
                    pdf_url = loc.get("pdf_url") or None
                papers.append({
                    "external_id": work.get("id"),
                    "source": "openalex",
                    "title": title,
                    "authors": authors,
                    "abstract": abstract or None,
                    "year": work.get("publication_year"),
                    "citation_count": work.get("cited_by_count"),
                    "url": url,
                    "pdf_url": pdf_url,
                    "doi": doi,
                    "reference_ids": [],
                })
            return papers
        except Exception as e:
            logger.debug(f"OpenAlex paper search failed for '{query}': {e}")
            return []

    async def get_work_by_doi(self, doi: str) -> Optional[dict]:
        """Fetch work by DOI. Returns dict with cited_by_count, publication_year, etc."""
        if not doi or not doi.strip():
            return None
        doi_clean = doi.strip().lower().replace("https://doi.org/", "")
        try:
            r = await self._client.get(
                f"{self.BASE}/works/https://doi.org/{doi_clean}",
                params=self._params(),
            )
            if r.status_code != 200:
                return None
            return r.json()
        except Exception as e:
            logger.debug(f"OpenAlex DOI lookup failed for {doi}: {e}")
            return None

    async def get_citation_count(self, doi: Optional[str] = None) -> Optional[int]:
        """Return cited_by_count for a work by DOI, or None if not found."""
        if not doi:
            return None
        work = await self.get_work_by_doi(doi)
        if work is None:
            return None
        return work.get("cited_by_count")

    async def get_citation_counts_batch(self, dois: List[str]) -> Dict[str, int]:
        """
        Fetch citation counts for multiple DOIs using a single batched OpenAlex filter query.

        OpenAlex supports pipe-separated DOI filters: `filter=doi:a|b|c`.
        Processes DOIs in batches of 50 (OpenAlex filter string length limit).
        Returns a dict of doi -> cited_by_count for all matched works.
        """
        results: Dict[str, int] = {}
        if not dois:
            return results

        # Normalise DOIs and process in batches of 50
        DOI_BATCH = 50
        cleaned = [d.strip().lower().replace("https://doi.org/", "") for d in dois if d and d.strip()]
        for i in range(0, len(cleaned), DOI_BATCH):
            batch = cleaned[i : i + DOI_BATCH]
            doi_filter = "|".join(batch)
            try:
                params: Dict[str, Any] = {
                    **self._params(),
                    "filter": f"doi:{doi_filter}",
                    "per-page": len(batch),
                    "select": "doi,cited_by_count",
                }
                r = await self._client.get(f"{self.BASE}/works", params=params)
                if r.status_code == 429:
                    logger.warning("OpenAlex rate limited during batch citation lookup")
                    continue
                if r.status_code != 200:
                    logger.debug(f"OpenAlex batch citation lookup returned {r.status_code}")
                    continue
                for work in (r.json().get("results") or []):
                    doi_raw = (work.get("doi") or "").replace("https://doi.org/", "").strip().lower()
                    count = work.get("cited_by_count")
                    if doi_raw and count is not None:
                        results[doi_raw] = count
            except Exception as e:
                logger.debug(f"OpenAlex batch citation lookup failed: {e}")

        return results

    async def close(self):
        await self._client.aclose()


openalex_client = OpenAlexClient()
