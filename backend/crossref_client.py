"""
Crossref API client for metadata-enriched literature search.
Crossref has excellent coverage of journal articles with rich metadata.
API is free with polite usage (email identification).
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class CrossrefClient:
    """
    Client for Crossref REST API.

    Crossref contains metadata for 150M+ scholarly works.
    Rate limit: 50 requests/second with polite pool (email header)
    """

    BASE_URL = "https://api.crossref.org"

    def __init__(self):
        self.email = os.environ.get("CROSSREF_EMAIL") or os.environ.get(
            "UNPAYWALL_EMAIL"
        )
        self.client = httpx.AsyncClient(timeout=20.0)

        if not self.email:
            logger.warning(
                "CROSSREF_EMAIL not configured. Crossref rate limits may be stricter."
            )

    def _headers(self) -> Dict[str, str]:
        headers = {
            "User-Agent": f"ResearchAI/1.0 (mailto:{self.email})"
            if self.email
            else "ResearchAI/1.0"
        }
        return headers

    async def search_papers(
        self,
        query: str,
        limit: int = 20,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        filter_type: Optional[
            str
        ] = None,  # e.g., "journal-article", "proceedings-article"
        sort: str = "relevance",  # or "published" for recency
    ) -> List[Dict[str, Any]]:
        """
        Search Crossref for papers.

        Args:
            query: Search query (searches title, abstract, author)
            limit: Max results (max 1000 per query)
            year_min: Minimum publication year
            year_max: Maximum publication year
            filter_type: Filter by work type
            sort: Sorting method
        """
        try:
            params: Dict[str, Any] = {
                "query": query,
                "rows": min(limit, 100),
                "sort": sort,
                "order": "desc" if sort == "published" else None,
            }

            # Build filter string
            filters = []
            if year_min:
                filters.append(f"from-pub-date:{year_min}")
            if year_max:
                filters.append(f"until-pub-date:{year_max}")
            if filter_type:
                filters.append(f"type:{filter_type}")

            if filters:
                params["filter"] = ",".join(filters)

            response = await self.client.get(
                f"{self.BASE_URL}/works", params=params, headers=self._headers()
            )

            if response.status_code == 429:
                logger.warning("Crossref rate limited")
                return []

            response.raise_for_status()
            data = response.json()

            results = []
            items = data.get("message", {}).get("items", [])

            for item in items:
                # Extract authors
                authors = []
                author_list = item.get("author", [])
                for author in author_list:
                    given = author.get("given", "")
                    family = author.get("family", "")
                    if given and family:
                        authors.append(f"{given} {family}")
                    elif family:
                        authors.append(family)

                # Extract year
                year = None
                published = (
                    item.get("published-print")
                    or item.get("published-online")
                    or item.get("published")
                )
                if published:
                    date_parts = published.get("date-parts", [[]])[0]
                    if date_parts:
                        try:
                            year = int(date_parts[0])
                        except (ValueError, IndexError):
                            pass

                # Try created date as fallback
                if not year and item.get("created"):
                    date_parts = item["created"].get("date-parts", [[]])[0]
                    if date_parts:
                        try:
                            year = int(date_parts[0])
                        except (ValueError, IndexError):
                            pass

                # Citation count (if available)
                citation_count = item.get("is-referenced-by-count")

                # DOI
                doi = item.get("DOI")

                # URL - prefer DOI resolver
                url = f"https://doi.org/{doi}" if doi else item.get("URL")

                # Abstract (rarely available in Crossref, but check)
                abstract = item.get("abstract")
                # Clean up Crossref's XML-ish abstract format if present
                if abstract and abstract.startswith("<"):
                    import re

                    abstract = re.sub(r"<[^>]+>", "", abstract)

                # Title (can be a list)
                title_list = item.get("title", [])
                title = (
                    title_list[0]
                    if title_list
                    else item.get("container-title", [""])[0]
                    if item.get("container-title")
                    else "Untitled"
                )

                paper = {
                    "external_id": doi or item.get("URL", ""),
                    "source": "crossref",
                    "title": title,
                    "authors": authors,
                    "abstract": abstract,
                    "year": year,
                    "citation_count": citation_count,
                    "url": url,
                    "pdf_url": None,  # Crossref doesn't provide direct PDF links
                    "doi": doi,
                    "reference_ids": [],
                }
                results.append(paper)

            logger.info(f"Crossref found {len(results)} papers for '{query}'")
            return results

        except httpx.HTTPStatusError as e:
            logger.error(f"Crossref HTTP error: {e}")
            return []
        except Exception as e:
            logger.error(f"Crossref search error: {e}")
            return []

    async def get_work_by_doi(self, doi: str) -> Optional[Dict[str, Any]]:
        """Get detailed work information by DOI."""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/works/{doi}", headers=self._headers()
            )

            if response.status_code == 404:
                return None

            response.raise_for_status()
            data = response.json()
            return data.get("message", {})

        except Exception as e:
            logger.error(f"Crossref DOI lookup error: {e}")
            return None

    async def get_references(self, doi: str) -> List[Dict[str, Any]]:
        """
        Get references for a work by DOI.
        NOTE: Reference data is often incomplete in Crossref.
        """
        work = await self.get_work_by_doi(doi)
        if not work:
            return []

        references = work.get("reference", [])
        return [
            {
                "doi": ref.get("DOI"),
                "title": ref.get("article-title") or ref.get("unstructured"),
                "authors": ref.get("author")
                if isinstance(ref.get("author"), list)
                else [],
            }
            for ref in references
        ]

    async def close(self):
        await self.client.aclose()


# Singleton instance
crossref_client = CrossrefClient()
