"""
Google Scholar client for literature search.

NOTE: This uses SerpAPI (serpapi.com) which provides a legal, rate-limited
API to Google Scholar results. You need a SERPAPI_KEY.

Alternatively, can use scholarly library with proxy rotation for direct
scraping (more complex, higher risk of blocks).
"""

import logging
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


@dataclass
class ScholarPaper:
    title: str
    authors: List[str]
    year: Optional[int]
    abstract: Optional[str]
    url: Optional[str]
    pdf_url: Optional[str]
    citation_count: Optional[int]
    doi: Optional[str]
    source: str = "google_scholar"


class GoogleScholarClient:
    """
    Google Scholar search via SerpAPI.

    Free tier: 100 searches/month
    Paid tier: $50/month for 5,000 searches
    """

    BASE_URL = "https://serpapi.com/search"

    def __init__(self):
        self.api_key = os.environ.get("SERPAPI_KEY")
        self.client = httpx.AsyncClient(timeout=30.0)
        self.enabled = bool(self.api_key)

        if not self.enabled:
            logger.warning(
                "SERPAPI_KEY not configured. Google Scholar search disabled."
            )

    async def search_papers(
        self,
        query: str,
        limit: int = 20,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        include_citations: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Search Google Scholar for papers.

        Args:
            query: Search query
            limit: Max results (capped at 20 by SerpAPI free tier per call)
            year_min: Minimum publication year
            year_max: Maximum publication year
            include_citations: Whether to include citation counts
        """
        if not self.enabled:
            return []

        try:
            params = {
                "engine": "google_scholar",
                "q": query,
                "api_key": self.api_key,
                "num": min(limit, 20),  # SerpAPI max per call
            }

            # Add year filter if provided
            if year_min or year_max:
                # Google Scholar uses "year_min-year_max" format
                y_min = year_min or ""
                y_max = year_max or ""
                params["as_ylo"] = str(y_min) if y_min else None
                params["as_yhi"] = str(y_max) if y_max else None

            response = await self.client.get(self.BASE_URL, params=params)

            if response.status_code == 429:
                logger.warning("Google Scholar (SerpAPI) rate limited")
                return []

            if response.status_code == 401:
                logger.error("Google Scholar (SerpAPI) authentication failed")
                return []

            response.raise_for_status()
            data = response.json()

            results = []
            organic_results = data.get("organic_results", [])

            for result in organic_results[:limit]:
                # Extract publication info
                publication_info = result.get("publication_info", {})

                # Parse year from summary or publication_info
                year = None
                summary = result.get("summary", "")

                # Try to extract year from summary (e.g., "... 2023 - nature.com")
                import re

                year_match = re.search(r"\b(19|20)\d{2}\b", summary)
                if year_match:
                    try:
                        year = int(year_match.group())
                    except ValueError:
                        pass

                # Authors
                authors = []
                author_info = publication_info.get("authors", [])
                if author_info:
                    authors = [a.get("name", "") for a in author_info if a.get("name")]
                else:
                    # Try to parse from summary (e.g., "Author1, Author2 - ...")
                    if " - " in summary:
                        author_part = summary.split(" - ")[0]
                        authors = [
                            a.strip() for a in author_part.split(",") if a.strip()
                        ]

                # Citation count
                citation_count = None
                if include_citations:
                    # Look for inline_links with cited_by
                    inline_links = result.get("inline_links", {})
                    cited_by = inline_links.get("cited_by", {})
                    if cited_by and cited_by.get("total"):
                        try:
                            citation_count = int(cited_by["total"])
                        except (ValueError, TypeError):
                            pass

                # PDF/Access links
                pdf_url = None
                resources = result.get("resources", [])
                for resource in resources:
                    if resource.get("file_format") == "PDF":
                        pdf_url = resource.get("link")
                        break

                # DOI extraction from link or summary
                doi = None
                link = result.get("link", "")
                if "doi.org/" in link:
                    doi = link.split("doi.org/")[-1].split("?")[0]

                paper = {
                    "external_id": result.get("result_id", ""),
                    "source": "google_scholar",
                    "title": result.get("title", ""),
                    "authors": authors,
                    "abstract": summary if summary else None,
                    "year": year,
                    "citation_count": citation_count,
                    "url": link,
                    "pdf_url": pdf_url,
                    "doi": doi,
                    "reference_ids": [],
                }
                results.append(paper)

            logger.info(f"Google Scholar found {len(results)} papers for '{query}'")
            return results

        except httpx.HTTPStatusError as e:
            logger.error(f"Google Scholar HTTP error: {e}")
            return []
        except Exception as e:
            logger.error(f"Google Scholar search error: {e}")
            return []

    async def get_citing_papers(
        self, paper_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get papers that cite the given paper.
        Requires the Google Scholar ID (result_id) from a previous search.

        NOTE: This is expensive - each call counts as a search.
        """
        if not self.enabled:
            return []

        try:
            params = {
                "engine": "google_scholar",
                "q": f"cites:{paper_id}",
                "api_key": self.api_key,
                "num": min(limit, 20),
            }

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            for result in data.get("organic_results", [])[:limit]:
                results.append(
                    {
                        "external_id": result.get("result_id", ""),
                        "source": "google_scholar",
                        "title": result.get("title", ""),
                        "url": result.get("link", ""),
                        "year": None,  # Would need parsing
                    }
                )

            return results

        except Exception as e:
            logger.error(f"Google Scholar citing papers error: {e}")
            return []

    async def close(self):
        await self.client.aclose()


# Singleton instance
google_scholar_client = GoogleScholarClient()
