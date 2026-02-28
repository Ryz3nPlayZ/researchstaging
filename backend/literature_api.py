"""
Literature Search API - REST endpoints for discovering and acquiring research papers.
Integrates with Semantic Scholar, arXiv, and Unpaywall for comprehensive literature search.
"""
import logging
import time
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from auth_dependencies import require_auth
from pydantic import BaseModel, Field
import httpx

from literature_service import LiteratureService
from intent_service import parse_query
from ranking_service import compute_ranking
from openalex_client import openalex_client
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, Paper, Reference

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/literature", tags=["literature"], dependencies=[Depends(require_auth)])

# Initialize literature service
literature_service = LiteratureService()

# Storage path for downloaded PDFs
STORAGE_PATH = Path(__file__).parent.parent / "storage" / "pdfs"
STORAGE_PATH.mkdir(parents=True, exist_ok=True)


# ============== Pydantic Models ==============

class RelevanceBreakdown(BaseModel):
    """Per-dimension relevance scores for explainability."""
    semantic_alignment: Optional[float] = None
    attribute_alignment: Optional[float] = None
    methodological_match: Optional[float] = None
    dataset_match: Optional[float] = None
    citation_signal: Optional[float] = None
    recency_score: Optional[float] = None
    final_score: Optional[float] = None


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
    relevance_breakdown: Optional[RelevanceBreakdown] = Field(None, description="Multi-dimensional relevance scores when use_ranking=true")
    final_score: Optional[float] = Field(None, description="Weighted final relevance score when use_ranking=true")


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


class SearchStageTrace(BaseModel):
    intent_ms: int
    retrieval_ms: int
    scoring_ms: int
    total_ms: int


class SearchDegradeTrace(BaseModel):
    skipped_citation_expansion: bool = False
    reduced_candidate_pool: bool = False
    cross_encoder_top_k_only: bool = False


class SearchV2Response(BaseModel):
    query: str
    phase: int
    candidate_pool_size: int
    returned_count: int
    intent: Dict[str, Any]
    timing: SearchStageTrace
    degrade: SearchDegradeTrace
    filter_drops: Dict[str, int] = Field(default_factory=dict)
    papers: List[PaperSearchResult]


# ============== API Endpoints ==============

async def _batch_openalex_citations(papers: List[Dict[str, Any]]) -> Dict[str, int]:
    """Fetch citation counts from OpenAlex for all papers with DOI. Returns doi -> count."""
    dois = list({(p.get("doi") or "").strip().lower() for p in papers if p.get("doi")} - {""})
    if not dois:
        return {}
    # Cap to 300 DOIs max — more than enough for ranking signal, avoids runaway latency
    dois = dois[:300]
    try:
        return await openalex_client.get_citation_counts_batch(dois)
    except Exception as e:
        logger.debug(f"OpenAlex batch citation lookup failed: {e}")
        return {}


def _paper_to_search_result(p: Dict[str, Any]) -> PaperSearchResult:
    """Build PaperSearchResult from paper dict, including optional relevance_breakdown."""
    breakdown = p.get("relevance_breakdown")
    rb = None
    if breakdown:
        # Map internal ranking keys to the explainability schema exposed to the UI.
        # ranking_service outputs: cross_encoder, dense_similarity, lexical_score,
        # attribute_alignment, citation_authority, graph_proximity, recency_score.
        rb = RelevanceBreakdown(
            semantic_alignment=breakdown.get("cross_encoder"),        # topic/phrase overlap
            attribute_alignment=breakdown.get("attribute_alignment"),  # method/type constraints
            methodological_match=breakdown.get("dense_similarity"),   # Jaccard token similarity
            dataset_match=breakdown.get("lexical_score"),             # BM25 keyword signal
            citation_signal=breakdown.get("citation_authority"),      # log citation count (normed)
            recency_score=breakdown.get("recency_score"),             # exponential decay from year
            final_score=breakdown.get("final_score"),
        )
    return PaperSearchResult(
        external_id=p.get("external_id"),
        source=p.get("source", "unknown"),
        title=p.get("title", ""),
        authors=p.get("authors") or [],
        abstract=p.get("abstract"),
        year=p.get("year"),
        citation_count=p.get("citation_count"),
        url=p.get("url"),
        pdf_url=p.get("pdf_url"),
        open_access_pdf_url=p.get("open_access_pdf_url"),
        doi=p.get("doi"),
        reference_ids=p.get("reference_ids") or [],
        relevance_breakdown=rb,
        final_score=p.get("final_score"),
    )


@router.get("/search", response_model=List[PaperSearchResult])
async def search_literature(
    query: str = Query(..., min_length=2, description="Search query for papers"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
    use_ranking: bool = Query(True, description="Use intent + multi-dimensional ranking and explainability"),
):
    """
    Search for papers across multiple literature databases.

    When use_ranking=true (default): runs domain-adaptive intent parsing, broad retrieval,
    OpenAlex citation enrichment, and multi-dimensional ranking; returns relevance_breakdown per paper.

    Integrates with:
    - Semantic Scholar, arXiv, Unpaywall, OpenAlex (citation counts)
    """
    if not query or len(query.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail="Query must be at least 2 characters long"
        )

    try:
        logger.info(f"Literature search query: '{query}', limit: {limit}, use_ranking: {use_ranking}")

        if use_ranking:
            # R5–R7: Query understanding
            intent = await parse_query(query)
            # Broad retrieval (R7, §3.2): intent-driven, cap 300 candidates
            papers = await literature_service.search_all_expanded(
                query=query,
                intent=intent,
                max_candidates=300,
                limit_per_source_per_query=50,
            )
            if not papers:
                logger.warning(f"No papers found for query: '{query}'")
                return []
            # Unpaywall enrichment (no sort; ranking will sort)
            papers = await literature_service.enrich_with_open_access(papers)
            # OpenAlex citation counts for ranking
            citation_counts_by_doi = await _batch_openalex_citations(papers)
            # R13–R16: Multi-dimensional ranking + explainability
            papers = compute_ranking(papers, intent, citation_counts_by_doi)
            # Trim to requested limit and build response with relevance_breakdown
            papers = papers[:limit]
            return [_paper_to_search_result(p) for p in papers]
        else:
            # Legacy path: single query, no intent/ranking
            papers = await literature_service.search_all(query, limit_per_source=limit)
            if not papers:
                return []
            sorted_papers = await literature_service.enrich_with_open_access(papers)
            return [_paper_to_search_result(p) for p in sorted_papers[:limit]]
    except Exception as e:
        logger.error(f"Literature search error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )


async def _run_v2_ranked_search(query: str, phase: int) -> SearchV2Response:
    """Internal implementation for deterministic literature search v2."""
    started = time.perf_counter()

    intent_started = time.perf_counter()
    intent = await parse_query(query)
    intent_ms = int((time.perf_counter() - intent_started) * 1000)

    target_pool = 800 if phase == 2 else 500
    fallback_pool = 500

    degrade = SearchDegradeTrace()

    retrieval_started = time.perf_counter()
    candidates = await literature_service.build_candidate_pool(query=query, intent=intent, phase=phase)
    retrieval_ms = int((time.perf_counter() - retrieval_started) * 1000)

    if retrieval_ms > 6000 and phase == 2:
        degrade.skipped_citation_expansion = True
        candidates = await literature_service.build_candidate_pool(query=query, intent=intent, phase=1)

    if len(candidates) > target_pool:
        candidates = candidates[:target_pool]

    scoring_started = time.perf_counter()
    citation_counts_by_doi = await _batch_openalex_citations(candidates)
    ranked = compute_ranking(candidates, intent, citation_counts_by_doi)
    scoring_ms = int((time.perf_counter() - scoring_started) * 1000)

    if scoring_ms > 6000:
        if len(candidates) > fallback_pool:
            degrade.reduced_candidate_pool = True
            candidates = candidates[:fallback_pool]
            ranked = compute_ranking(candidates, intent, citation_counts_by_doi)

        if len(candidates) > 300:
            degrade.cross_encoder_top_k_only = True
            candidates = candidates[:300]
            ranked = compute_ranking(candidates, intent, citation_counts_by_doi)

    top_ranked = ranked[:50]

    # Enrich only the top-50 papers with Unpaywall OA links — much cheaper than enriching
    # all candidates upfront, and open-access URLs are only needed for the returned results.
    # preserve_order=True keeps the relevance ranking computed above intact.
    top_ranked = await literature_service.enrich_with_open_access(top_ranked, preserve_order=True)

    total_ms = int((time.perf_counter() - started) * 1000)

    filter_drops: Dict[str, int] = {}
    if ranked:
        filter_drops = (ranked[0].get("ranking_meta") or {}).get("dropped") or {}

    return SearchV2Response(
        query=query,
        phase=phase,
        candidate_pool_size=len(candidates),
        returned_count=len(top_ranked),
        intent=intent,
        timing=SearchStageTrace(
            intent_ms=intent_ms,
            retrieval_ms=retrieval_ms,
            scoring_ms=scoring_ms,
            total_ms=total_ms,
        ),
        degrade=degrade,
        filter_drops=filter_drops,
        papers=[_paper_to_search_result(paper) for paper in top_ranked],
    )


@router.get("/search/v2", response_model=SearchV2Response)
async def search_literature_v2(
    query: str = Query(..., min_length=2, description="Search query for papers"),
):
    """Deterministic literature search v2 (phase 1, fixed candidate pool=500)."""
    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters long")

    try:
        return await _run_v2_ranked_search(query=query, phase=1)
    except Exception as e:
        logger.error(f"Literature search v2 error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search v2 failed: {str(e)}")


@router.get("/search/v2/refine", response_model=SearchV2Response)
async def search_literature_v2_refine(
    query: str = Query(..., min_length=2, description="Search query for papers"),
):
    """Refine mode for literature search v2 (phase 2, fixed candidate pool=800)."""
    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters long")

    try:
        return await _run_v2_ranked_search(query=query, phase=2)
    except Exception as e:
        logger.error(f"Literature search v2 refine error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search v2 refine failed: {str(e)}")


@router.get("/papers/{paper_id}", response_model=PaperDetail)
async def get_paper_details(
    paper_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific paper.

    Returns full metadata including abstract, all authors, references,
    and citation count. First checks if paper exists in database (added to a project),
    then could be extended to fetch from external sources if needed.
    """
    try:
        # Query database for paper by either internal ID or external ID
        result = await db.execute(
            select(Paper).where(
                (Paper.id == paper_id) | (Paper.external_id == paper_id)
            )
        )
        paper = result.scalar_one_or_none()

        if not paper:
            raise HTTPException(
                status_code=404,
                detail=f"Paper '{paper_id}' not found. It may not have been added to any project yet."
            )

        # Fetch references for this paper
        refs_result = await db.execute(
            select(Reference).where(Reference.paper_id == paper.id)
        )
        references = refs_result.scalars().all()

        # Build references list
        references_list = [
            {
                "id": ref.id,
                "raw_text": ref.raw_text,
                "parsed_metadata": ref.parsed_metadata,
                "confidence_score": ref.confidence_score,
            }
            for ref in references
        ]

        return PaperDetail(
            external_id=paper.external_id,
            source=paper.source,
            title=paper.title,
            authors=paper.authors or [],
            abstract=paper.abstract,
            year=paper.year,
            citation_count=paper.citation_count,
            url=paper.url,
            pdf_url=paper.pdf_url,
            open_access_pdf_url=None,  # Not stored in DB yet, can be added
            doi=None,  # Not stored in DB yet, can be added
            reference_ids=[],  # Can be populated from references if needed
            references=references_list,
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
