"""
Literature Search API - REST endpoints for discovering and acquiring research papers.
Integrates with Semantic Scholar, arXiv, and Unpaywall for comprehensive literature search.
"""
import logging
import asyncio
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
import httpx
import os

from literature_service import LiteratureService

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/literature", tags=["literature"])

# Initialize literature service
literature_service = LiteratureService()

# Storage path for downloaded PDFs
STORAGE_PATH = Path(__file__).parent.parent / "storage" / "pdfs"
STORAGE_PATH.mkdir(parents=True, exist_ok=True)


# ============== Pydantic Models ==============

class PaperSearchResult(BaseModel):
    """Paper search result model."""
    external_id: Optional[str] = None
    source: str = Field(..., description="Source database (semantic_scholar, arxiv)")
    title: str = Field(..., min_length=1)
    authors: List[str] = Field(default_factory=list)
    abstract: Optional[str] = None
    year: Optional[int] = None
    citation_count: Optional[int] = None
    url: Optional[str] = None
    pdf_url: Optional[str] = Field(None, description="Direct URL to PDF if available")
    open_access_pdf_url: Optional[str] = Field(None, description="Open-access PDF URL from Unpaywall")
    doi: Optional[str] = Field(None, description="Digital Object Identifier")
    reference_ids: List[str] = Field(default_factory=list)


class PaperDetail(BaseModel):
    """Detailed paper information."""
    external_id: Optional[str] = None
    source: str
    title: str
    authors: List[str]
    abstract: Optional[str] = None
    year: Optional[int] = None
    citation_count: Optional[int] = None
    url: Optional[str] = None
    pdf_url: Optional[str] = None
    open_access_pdf_url: Optional[str] = None
    doi: Optional[str] = None
    reference_ids: List[str] = Field(default_factory=list)
    references: List[Dict[str, Any]] = Field(default_factory=list)


class DownloadResponse(BaseModel):
    """PDF download response."""
    paper_id: str
    file_path: str
    file_size: int
    source_url: Optional[str] = None
    message: str = "PDF downloaded successfully"


# ============== Helper Functions ==============

def extract_doi_from_paper(paper: Dict[str, Any]) -> Optional[str]:
    """Extract DOI from paper metadata."""
    # Try common DOI fields
    if 'doi' in paper:
        return paper.get('doi')

    # Try to extract from URL (Semantic Scholar pattern)
    url = paper.get('url', '')
    if 'doi.org' in url:
        return url.split('doi.org/')[-1]

    # Try citation styles (Semantic Scholar provides this)
    citation_styles = paper.get('citation_styles', {})
    if citation_styles and isinstance(citation_styles, dict):
        doi_style = citation_styles.get('doi', '')
        if doi_style and 'doi.org' in doi_style:
            return doi_style.split('doi.org/')[-1]

    return None


def sort_papers_by_priority(papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sort papers by priority:
    1. Has open-access PDF (first priority)
    2. Citation count (descending, second priority)
    3. Year (descending, third priority)
    """
    def sort_key(paper):
        has_pdf = 1 if paper.get('open_access_pdf_url') or paper.get('pdf_url') else 0
        citations = paper.get('citation_count') or 0
        year = paper.get('year') or 0
        return (-has_pdf, -citations, -year)  # Negative for descending

    return sorted(papers, key=sort_key)


# ============== API Endpoints ==============

@router.get("/search", response_model=List[PaperSearchResult])
async def search_literature(
    query: str = Query(..., min_length=2, description="Search query for papers"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results per source")
):
    """
    Search for papers across multiple literature databases.

    Integrates with:
    - Semantic Scholar (academic papers with citations)
    - arXiv (preprints and technical reports)
    - Unpaywall (open-access PDF lookup)

    Results are prioritized by:
    1. Open-access PDF availability
    2. Citation count
    3. Publication year
    """
    if not query or len(query.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail="Query must be at least 2 characters long"
        )

    try:
        logger.info(f"Literature search query: '{query}', limit per source: {limit}")

        # Search all sources
        papers = await literature_service.search_all(query, limit_per_source=limit)

        if not papers:
            logger.warning(f"No papers found for query: '{query}'")
            return []

        # Enrich with Unpaywall for papers with DOIs
        logger.info(f"Enriching {len(papers)} papers with Unpaywall...")
        enriched_papers = await enrich_with_open_access(papers)

        # Sort by priority (PDF access, citations, year)
        sorted_papers = sort_papers_by_priority(enriched_papers)

        logger.info(f"Returning {len(sorted_papers)} papers for query: '{query}'")
        return sorted_papers

    except Exception as e:
        logger.error(f"Literature search error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )


async def enrich_with_open_access(papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Enrich papers with open-access PDF URLs from Unpaywall.

    For papers with DOIs, queries Unpaywall API to find free versions.
    Adds open_access_pdf_url field if found.
    """
    # Collect papers with DOIs
    papers_with_doi = []
    for paper in papers:
        doi = extract_doi_from_paper(paper)
        if doi:
            paper['doi'] = doi
            papers_with_doi.append(paper)

    if not papers_with_doi:
        logger.info("No papers with DOIs found, skipping Unpaywall enrichment")
        return papers

    logger.info(f"Looking up open access for {len(papers_with_doi)} papers via Unpaywall...")

    # Parallel Unpaywall lookups with rate limiting
    async def lookup_paper(paper):
        doi = paper.get('doi')
        if not doi:
            return paper

        try:
            # Rate limiting: small delay between requests
            await asyncio.sleep(0.1)

            oa_result = await literature_service.unpaywall.find_open_access(doi)
            if oa_result and oa_result.get('oa_url'):
                paper['open_access_pdf_url'] = oa_result['oa_url']
                logger.debug(f"Found OA PDF for DOI {doi}: {oa_result['oa_url']}")
            else:
                logger.debug(f"No OA PDF found for DOI {doi}")

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
    enriched_map = {p['external_id']: p for p in enriched_papers if not isinstance(p, Exception)}

    for paper in papers:
        if paper.get('doi') and paper.get('external_id') in enriched_map:
            result.append(enriched_map[paper['external_id']])
        else:
            result.append(paper)

    oa_count = sum(1 for p in result if p.get('open_access_pdf_url'))
    logger.info(f"Unpaywall enrichment complete: {oa_count}/{len(papers)} papers have OA PDFs")

    return result


@router.get("/papers/{paper_id}", response_model=PaperDetail)
async def get_paper_details(paper_id: str):
    """
    Get detailed information about a specific paper.

    Returns full metadata including abstract, all authors, references,
    and citation count.
    """
    try:
        # For now, we'll return a 404 since we don't have persistent paper storage
        # This will be implemented in Phase 5-02 when we add paper management
        raise HTTPException(
            status_code=404,
            detail=f"Paper details not yet implemented. Use search results for available information."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching paper {paper_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch paper details: {str(e)}"
        )


@router.post("/papers/{paper_id}/download", response_model=DownloadResponse)
async def download_paper_pdf(
    paper_id: str,
    background_tasks: BackgroundTasks,
    pdf_url: Optional[str] = Query(None, description="Direct URL to PDF")
):
    """
    Download PDF for a paper and save to local storage.

    If pdf_url is provided, downloads from that URL.
    Otherwise, searches for available PDF URLs from paper metadata.

    Saves to: backend/storage/pdfs/{paper_id}.pdf
    """
    try:
        if not pdf_url:
            raise HTTPException(
                status_code=400,
                detail="PDF URL required. Provide pdf_url query parameter."
            )

        logger.info(f"Downloading PDF for paper {paper_id} from {pdf_url}")

        # Download PDF
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(pdf_url)
            response.raise_for_status()

            # Verify it's a PDF
            content_type = response.headers.get('content-type', '')
            if 'pdf' not in content_type.lower() and not response.content[:4].startswith(b'%PDF'):
                logger.warning(f"Downloaded content may not be a PDF: {content_type}")

            # Save to storage
            file_path = STORAGE_PATH / f"{paper_id}.pdf"
            file_path.write_bytes(response.content)
            file_size = len(response.content)

            logger.info(f"PDF saved to {file_path} ({file_size} bytes)")

            return DownloadResponse(
                paper_id=paper_id,
                file_path=str(file_path),
                file_size=file_size,
                source_url=pdf_url,
                message="PDF downloaded successfully"
            )

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error downloading PDF: {e}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Failed to download PDF: {e.response.status_code} {e.response.reason_phrase}"
        )
    except Exception as e:
        logger.error(f"Error downloading PDF: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Download failed: {str(e)}"
        )


# ============== Health Check ==============

@router.get("/health")
async def health_check():
    """Literature API health check."""
    return {
        "status": "healthy",
        "sources": ["semantic_scholar", "arxiv", "unpaywall"],
        "storage_path": str(STORAGE_PATH)
    }
