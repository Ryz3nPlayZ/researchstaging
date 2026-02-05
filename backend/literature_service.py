"""
Literature Search Service - Semantic Scholar & arXiv integration.
"""
import httpx
import asyncio
import logging
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class SemanticScholarClient:
    """Client for Semantic Scholar API."""

    BASE_URL = "https://api.semanticscholar.org/graph/v1"

    def __init__(self):
        self.api_key = os.environ.get("SEMANTIC_SCHOLAR_API_KEY")
        self.client = httpx.AsyncClient(timeout=30.0)
        self._last_request_time = 0
        self._min_request_interval = 1.0  # 1 second between requests to avoid rate limiting
    
    async def _rate_limit(self):
        """Ensure we don't exceed rate limits."""
        import time
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self._min_request_interval:
            await asyncio.sleep(self._min_request_interval - elapsed)
        self._last_request_time = time.time()
    
    def _extract_doi(self, paper: Dict[str, Any]) -> Optional[str]:
        """Extract DOI from Semantic Scholar paper metadata."""
        # Try direct DOI field
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
        fields: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Search for papers on Semantic Scholar."""
        if fields is None:
            fields = [
                "paperId", "title", "abstract", "authors", "year",
                "citationCount", "url", "openAccessPdf", "citationStyles",
                "references", "doi", "externalIds"
            ]

        await self._rate_limit()

        # Prepare headers with API key if available
        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/paper/search",
                params={
                    "query": query,
                    "limit": limit,
                    "fields": ",".join(fields)
                },
                headers=headers
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
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
    
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


class LiteratureService:
    """Combined literature search service."""

    def __init__(self):
        self.semantic_scholar = SemanticScholarClient()
        self.arxiv = ArxivClient()
        self.unpaywall = UnpaywallClient()
    
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

    async def enrich_with_open_access(self, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enrich papers with open access PDF URLs from Unpaywall.

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

        # Sort by priority
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
