"""
Citation API: REST endpoints for citation formatting and management.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from auth_dependencies import require_auth
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from database import get_db
from citation_service import CitationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/citations", tags=["citations"], dependencies=[Depends(require_auth)])


# ============== Pydantic Models ==============

class FormatPaperRequest(BaseModel):
    """Request model for formatting a literature search paper as a citation."""
    paper: Dict[str, Any] = Field(..., description="Paper metadata from literature search")
    styles: List[str] = Field(default=["apa", "mla", "chicago"], description="Citation styles to generate")


class FormatPaperResponse(BaseModel):
    """Response model for formatted paper citations."""
    apa: Optional[str] = Field(None, description="APA 7th edition formatted citation")
    mla: Optional[str] = Field(None, description="MLA 9th edition formatted citation")
    chicago: Optional[str] = Field(None, description="Chicago 17th edition formatted citation")


# ============== Citation Formatting Endpoints ==============

@router.post("/format-paper", response_model=FormatPaperResponse)
async def format_paper_citation(
    request: FormatPaperRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Format a literature search paper as a citation in multiple styles.

    Accepts paper metadata from Semantic Scholar/arXiv and returns
    formatted citations in APA, MLA, and Chicago styles.

    Paper metadata should include:
    - title (required): Paper title
    - authors (required): List of author names
    - year (optional): Publication year
    - venue (optional): Journal or conference name
    - doi (optional): Digital Object Identifier
    - url (optional): Paper URL
    - source (optional): Source database (semantic_scholar, arxiv)

    Returns: Dict with apa, mla, chicago keys
    """
    # Extract paper metadata
    paper = request.paper
    title = paper.get("title")
    authors = paper.get("authors", [])

    # Validate required fields
    if not title:
        raise HTTPException(
            status_code=400,
            detail="Paper metadata must include 'title' field"
        )

    if not authors or len(authors) == 0:
        raise HTTPException(
            status_code=400,
            detail="Paper metadata must include 'authors' field with at least one author"
        )

    # Extract optional fields
    year = paper.get("year")
    venue = paper.get("venue", "")
    doi = paper.get("doi", "")
    url = paper.get("url", "")
    source = paper.get("source", "")

    # For arXiv preprints, use source as venue if venue not provided
    if not venue and source == "arxiv":
        venue = "arXiv preprint"

    # Initialize citation service
    citation_service = CitationService(session)

    # Format citations for each requested style
    formatted_citations = {}
    requested_styles = request.styles if request.styles else ["apa", "mla", "chicago"]

    for style in requested_styles:
        style = style.lower()

        if style == "apa":
            formatted_citations["apa"] = citation_service._format_apa(
                authors=authors,
                year=year,
                title=title,
                venue=venue
            )
        elif style == "mla":
            formatted_citations["mla"] = citation_service._format_mla(
                authors=authors,
                year=year,
                title=title,
                venue=venue
            )
        elif style == "chicago":
            formatted_citations["chicago"] = citation_service._format_chicago(
                authors=authors,
                year=year,
                title=title,
                venue=venue
            )
        else:
            logger.warning(f"Unknown citation style requested: {style}")

    logger.info(f"Formatted paper citation in {len(formatted_citations)} styles: {title[:50]}...")

    return FormatPaperResponse(**formatted_citations)


@router.get("/health")
async def citation_health():
    """Health check endpoint for citation service."""
    return {"status": "healthy", "service": "citation_api"}
