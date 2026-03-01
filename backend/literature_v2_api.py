"""
Literature Search API V2 - Enhanced endpoints with more sources and feedback.
"""

import logging
from typing import Any, Dict, List, Optional

from auth_dependencies import require_auth
from fastapi import APIRouter, Depends, HTTPException, Query
from literature_v2_service import literature_v2_service
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/literature-v2",
    tags=["literature-v2"],
    dependencies=[Depends(require_auth)],
)


# ============== Pydantic Models ==============


class RelevanceBreakdownV2(BaseModel):
    """Extended relevance scores for V2."""

    semantic_alignment: Optional[float] = None
    attribute_alignment: Optional[float] = None
    methodological_match: Optional[float] = None
    dataset_match: Optional[float] = None
    citation_signal: Optional[float] = None
    recency_score: Optional[float] = None
    source_diversity_score: Optional[float] = Field(
        None, description="Boost for appearing in multiple sources"
    )
    feedback_boost: Optional[float] = Field(
        None, description="Boost from user feedback"
    )
    final_score: Optional[float] = None


class PaperV2(BaseModel):
    """Paper result model V2."""

    external_id: Optional[str] = None
    source: str = Field(
        ...,
        description="Source database(s), may be combined like 'semantic_scholar + crossref'",
    )
    title: str = Field(..., min_length=1)
    authors: List[str] = Field(default_factory=list)
    abstract: Optional[str] = None
    year: Optional[int] = None
    citation_count: Optional[int] = None
    url: Optional[str] = None
    pdf_url: Optional[str] = Field(None, description="Direct PDF URL from source")
    open_access_pdf_url: Optional[str] = Field(
        None, description="Open-access PDF URL from Unpaywall"
    )
    doi: Optional[str] = None
    reference_ids: List[str] = Field(default_factory=list)
    relevance_breakdown: Optional[RelevanceBreakdownV2] = None
    final_score: Optional[float] = None
    v2_enhanced: bool = True


class TimingBreakdown(BaseModel):
    intent_ms: int
    search_ms: int
    dedup_ms: int
    rank_ms: int
    enrich_ms: int
    total_ms: int


class SearchV2Response(BaseModel):
    """V2 Search response with enhanced metadata."""

    query: str
    papers: List[PaperV2]
    intent: Dict[str, Any]
    total_found: int
    from_cache: bool = False
    sources: List[str] = Field(
        default_factory=list, description="List of sources that returned results"
    )
    timing: TimingBreakdown


class FeedbackRequest(BaseModel):
    paper_id: str
    query: str
    relevant: bool = Field(..., description="True for thumbs up, False for thumbs down")


class FeedbackResponse(BaseModel):
    success: bool
    message: str


class SimilarPapersResponse(BaseModel):
    source_paper_id: str
    papers: List[PaperV2]


# ============== API Endpoints ==============


@router.get("/search", response_model=SearchV2Response)
async def search_literature_v2(
    query: str = Query(..., min_length=2, description="Search query for papers"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    include_scholar: bool = Query(
        True, description="Include Google Scholar (requires SERPAPI_KEY)"
    ),
    include_crossref: bool = Query(True, description="Include Crossref"),
    use_cache: bool = Query(True, description="Use cached results if available"),
):
    """
    Search for papers across multiple literature databases (V2 Enhanced).

    V2 improvements:
    - Additional sources: Google Scholar, Crossref (when configured)
    - Better deduplication across sources
    - Source diversity scoring (papers in multiple sources rank higher)
    - Detailed timing breakdown
    """
    if not query or len(query.strip()) < 2:
        raise HTTPException(
            status_code=400, detail="Query must be at least 2 characters long"
        )

    try:
        logger.info(
            f"Literature V2 search: '{query}', limit={limit}, scholar={include_scholar}, crossref={include_crossref}"
        )

        result = await literature_v2_service.search(
            query=query,
            limit=limit,
            use_cache=use_cache,
            include_scholar=include_scholar,
            include_crossref=include_crossref,
        )

        # Convert to response model
        papers = []
        for p in result["papers"]:
            rb = p.get("relevance_breakdown", {})
            papers.append(
                PaperV2(
                    external_id=p.get("external_id"),
                    source=p.get("source", "unknown"),
                    title=p.get("title", ""),
                    authors=p.get("authors", []),
                    abstract=p.get("abstract"),
                    year=p.get("year"),
                    citation_count=p.get("citation_count"),
                    url=p.get("url"),
                    pdf_url=p.get("pdf_url"),
                    open_access_pdf_url=p.get("open_access_pdf_url"),
                    doi=p.get("doi"),
                    reference_ids=p.get("reference_ids", []),
                    relevance_breakdown=RelevanceBreakdownV2(
                        semantic_alignment=rb.get("cross_encoder"),
                        attribute_alignment=rb.get("attribute_alignment"),
                        methodological_match=rb.get("dense_similarity"),
                        dataset_match=rb.get("lexical_score"),
                        citation_signal=rb.get("citation_authority"),
                        recency_score=rb.get("recency_score"),
                        source_diversity_score=p.get("source_diversity_score"),
                        feedback_boost=p.get("feedback_boost"),
                        final_score=rb.get("final_score") or p.get("final_score"),
                    ),
                    final_score=p.get("final_score"),
                    v2_enhanced=p.get("v2_enhanced", True),
                )
            )

        return SearchV2Response(
            query=result["query"],
            papers=papers,
            intent=result["intent"],
            total_found=result["total_found"],
            from_cache=result["from_cache"],
            sources=result["sources"],
            timing=TimingBreakdown(**result["timing"]),
        )

    except Exception as e:
        logger.error(f"Literature V2 search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
):
    """
    Submit user feedback on a paper result.

    This feedback is used to improve future ranking for similar queries.
    """
    try:
        literature_v2_service.add_feedback(
            paper_id=request.paper_id, query=request.query, relevant=request.relevant
        )

        return FeedbackResponse(success=True, message="Feedback recorded. Thank you!")
    except Exception as e:
        logger.error(f"Feedback submission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to record feedback")


@router.get("/similar/{paper_id}", response_model=SimilarPapersResponse)
async def get_similar_papers(
    paper_id: str,
    limit: int = Query(10, ge=1, le=50),
):
    """
    Find papers similar to a given paper.

    Uses the paper's title and abstract to find semantically similar results.
    """
    try:
        similar = await literature_v2_service.get_similar_papers(paper_id, limit)

        papers = []
        for p in similar:
            papers.append(
                PaperV2(
                    external_id=p.get("external_id"),
                    source=p.get("source", "unknown"),
                    title=p.get("title", ""),
                    authors=p.get("authors", []),
                    abstract=p.get("abstract"),
                    year=p.get("year"),
                    citation_count=p.get("citation_count"),
                    url=p.get("url"),
                    pdf_url=p.get("pdf_url"),
                    open_access_pdf_url=p.get("open_access_pdf_url"),
                    doi=p.get("doi"),
                    v2_enhanced=True,
                )
            )

        return SimilarPapersResponse(source_paper_id=paper_id, papers=papers)

    except Exception as e:
        logger.error(f"Similar papers error: {e}")
        raise HTTPException(status_code=500, detail="Failed to find similar papers")


@router.get("/health")
async def health_check():
    """V2 API health check with source status."""
    return {
        "status": "healthy",
        "version": "2.0",
        "sources": {
            "semantic_scholar": True,
            "arxiv": True,
            "openalex": True,
            "google_scholar": literature_v2_service.google_scholar.enabled,
            "crossref": True,
        },
    }
