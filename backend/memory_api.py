"""
Memory API: REST endpoints for claims, findings, and preferences.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from sqlalchemy import text

from database import get_db
from database.models import ClaimSourceType
from memory_service import MemoryService
from api_models import (
    ClaimRequest, ClaimResponse,
    FindingRequest, FindingResponse,
    PreferenceRequest, PreferenceResponse,
    ClaimRelationshipResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/memory", tags=["memory"])


# ============== Claims ==============

@router.get("/projects/{project_id}/claims", response_model=List[ClaimResponse])
async def get_claims(
    project_id: str,
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    source_id: Optional[str] = Query(None, description="Filter by source ID"),
    claim_type: Optional[str] = Query(None, description="Filter by claim type"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence"),
    limit: int = Query(100, ge=1, le=1000, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    session: AsyncSession = Depends(get_db),
):
    """
    List claims for a project with optional filters.

    Returns paginated list of claims sorted by relevance_score.
    """
    service = MemoryService(session)

    source_type_enum = None
    if source_type:
        try:
            source_type_enum = ClaimSourceType(source_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid source_type: {source_type}")

    claims = await service.list_claims(
        project_id=project_id,
        source_type=source_type_enum,
        source_id=source_id,
        min_confidence=min_confidence,
        limit=limit,
        offset=offset,
    )

    return [ClaimResponse.model_validate(c) for c in claims]


@router.get("/projects/{project_id}/claims/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    project_id: str,
    claim_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Get a single claim by ID."""
    service = MemoryService(session)
    claim = await service.get_claim(claim_id)

    if not claim or claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="Claim not found")

    return ClaimResponse.model_validate(claim)


@router.post("/projects/{project_id}/claims", response_model=ClaimResponse, status_code=201)
async def create_claim(
    project_id: str,
    claim_request: ClaimRequest,
    session: AsyncSession = Depends(get_db),
):
    """Create a new claim."""
    service = MemoryService(session)

    try:
        source_type_enum = ClaimSourceType(claim_request.source_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid source_type: {claim_request.source_type}")

    claim = await service.create_claim(
        project_id=project_id,
        claim_text=claim_request.claim_text,
        claim_type=claim_request.claim_type,
        claim_data=claim_request.claim_data,
        source_type=source_type_enum,
        source_id=claim_request.source_id,
        confidence=claim_request.confidence,
    )

    return ClaimResponse.model_validate(claim)


@router.put("/projects/{project_id}/claims/{claim_id}", response_model=ClaimResponse)
async def update_claim(
    project_id: str,
    claim_id: str,
    claim_text: Optional[str] = None,
    claim_type: Optional[str] = None,
    claim_data: Optional[dict] = None,
    relevance_score: Optional[float] = None,
    session: AsyncSession = Depends(get_db),
):
    """Update a claim."""
    service = MemoryService(session)

    claim = await service.get_claim(claim_id)
    if not claim or claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="Claim not found")

    updated = await service.update_claim(
        claim_id=claim_id,
        claim_text=claim_text,
        claim_type=claim_type,
        claim_data=claim_data,
        relevance_score=relevance_score,
    )

    return ClaimResponse.model_validate(updated)


@router.delete("/projects/{project_id}/claims/{claim_id}", status_code=204)
async def delete_claim(
    project_id: str,
    claim_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Delete a claim."""
    service = MemoryService(session)

    claim = await service.get_claim(claim_id)
    if not claim or claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="Claim not found")

    await service.delete_claim(claim_id)


@router.get("/projects/{project_id}/claims/search", response_model=List[ClaimResponse])
async def search_claims(
    project_id: str,
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    """
    Full-text search on claim_text field.

    Uses PostgreSQL GIN index for efficient search.
    """
    service = MemoryService(session)
    claims = await service.search_claims(
        project_id=project_id,
        query=q,
        limit=limit,
    )

    return [ClaimResponse.model_validate(c) for c in claims]


# ============== Graph Traversal and Relationships ==============

@router.get("/projects/{project_id}/claims/{claim_id}/related", response_model=List[ClaimResponse])
async def get_related_claims(
    project_id: str,
    claim_id: str,
    max_depth: int = Query(3, ge=1, le=5, description="Max traversal depth"),
    relationship_type: Optional[str] = Query(None, description="Filter by relationship type"),
    session: AsyncSession = Depends(get_db),
):
    """
    Get related claims via graph traversal.

    Uses recursive CTE to traverse claim relationships up to max_depth.
    Returns claims sorted by depth (closest first).
    """
    service = MemoryService(session)

    # Verify claim exists and belongs to project
    claim = await service.get_claim(claim_id)
    if not claim or claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Use the service method that handles recursive CTE
    from database.models import RelationshipType

    rel_type_enum = None
    if relationship_type:
        try:
            rel_type_enum = RelationshipType(relationship_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid relationship_type: {relationship_type}")

    related_claims_data = await service.get_related_claims(
        claim_id=claim_id,
        relationship_type=rel_type_enum,
        max_depth=max_depth,
        limit=50,
    )

    # Fetch full claim objects for each related claim ID
    claims = []
    for claim_data in related_claims_data:
        c = await service.get_claim(claim_data["claim_id"])
        if c:
            claims.append(c)

    return [ClaimResponse.model_validate(c) for c in claims]


@router.post("/projects/{project_id}/claims/{from_claim_id}/relationships/{to_claim_id}", response_model=ClaimRelationshipResponse, status_code=201)
async def create_relationship(
    project_id: str,
    from_claim_id: str,
    to_claim_id: str,
    relationship_type: str = Query(..., description="Type of relationship"),
    strength: float = Query(0.5, ge=0.0, le=1.0),
    metadata: Optional[dict] = None,
    session: AsyncSession = Depends(get_db),
):
    """Create a relationship between two claims."""
    service = MemoryService(session)
    from database.models import RelationshipType

    # Verify both claims exist
    from_claim = await service.get_claim(from_claim_id)
    to_claim = await service.get_claim(to_claim_id)

    if not from_claim or from_claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="From claim not found")
    if not to_claim or to_claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="To claim not found")

    try:
        rel_type_enum = RelationshipType(relationship_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid relationship_type: {relationship_type}")

    relationship = await service.create_claim_relationship(
        project_id=project_id,
        from_claim_id=from_claim_id,
        to_claim_id=to_claim_id,
        relationship_type=rel_type_enum,
        strength=strength,
        relationship_metadata=metadata or {},
    )

    return ClaimRelationshipResponse(
        id=relationship.id,
        project_id=relationship.project_id,
        from_claim_id=relationship.from_claim_id,
        to_claim_id=relationship.to_claim_id,
        relationship_type=relationship.relationship_type.value,
        strength=relationship.strength,
        metadata=relationship.relationship_metadata,
        created_at=relationship.created_at,
    )


@router.get("/projects/{project_id}/claims/{claim_id}/relationships", response_model=List[ClaimRelationshipResponse])
async def get_claim_relationships(
    project_id: str,
    claim_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Get all relationships for a claim (both incoming and outgoing)."""
    service = MemoryService(session)

    claim = await service.get_claim(claim_id)
    if not claim or claim.project_id != project_id:
        raise HTTPException(status_code=404, detail="Claim not found")

    relationships = await service.get_claim_relationships(claim_id)

    return [
        ClaimRelationshipResponse(
            id=r.id,
            project_id=r.project_id,
            from_claim_id=r.from_claim_id,
            to_claim_id=r.to_claim_id,
            relationship_type=r.relationship_type.value,
            strength=r.strength,
            metadata=r.relationship_metadata,
            created_at=r.created_at,
        )
        for r in relationships
    ]


# ============== Findings ==============

@router.get("/projects/{project_id}/findings", response_model=List[FindingResponse])
async def get_findings(
    project_id: str,
    analysis_type: Optional[str] = Query(None),
    min_significance: Optional[float] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    session: AsyncSession = Depends(get_db),
):
    """List findings for a project."""
    service = MemoryService(session)
    findings = await service.list_findings(
        project_id=project_id,
        analysis_type=analysis_type,
        min_significance=min_significance,
        limit=limit,
    )
    return [FindingResponse.model_validate(f) for f in findings]


@router.post("/projects/{project_id}/findings", response_model=FindingResponse, status_code=201)
async def create_finding(
    project_id: str,
    finding_request: FindingRequest,
    session: AsyncSession = Depends(get_db),
):
    """Create a new finding."""
    service = MemoryService(session)
    finding = await service.create_finding(
        project_id=project_id,
        finding_text=finding_request.finding_text,
        finding_type=finding_request.finding_type,
        finding_data=finding_request.finding_data,
        source_analysis_id=finding_request.source_analysis_id,
        analysis_type=finding_request.analysis_type,
        significance=finding_request.significance,
    )
    return FindingResponse.model_validate(finding)


# ============== Preferences ==============

@router.get("/projects/{project_id}/preferences", response_model=List[PreferenceResponse])
async def get_preferences(
    project_id: str,
    category: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_db),
):
    """Get all preferences for a project."""
    service = MemoryService(session)
    prefs = await service.list_preferences(project_id, category)
    return [PreferenceResponse.model_validate(p) for p in prefs]


@router.put("/projects/{project_id}/preferences/{key}", response_model=PreferenceResponse)
async def set_preference(
    project_id: str,
    key: str,
    value: dict = None,
    category: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
):
    """Set a preference (creates or updates)."""
    service = MemoryService(session)
    pref = await service.set_preference(project_id, key, value, category)
    return PreferenceResponse.model_validate(pref)


@router.get("/projects/{project_id}/preferences/{key}", response_model=PreferenceResponse)
async def get_preference(
    project_id: str,
    key: str,
    session: AsyncSession = Depends(get_db),
):
    """Get a specific preference by key."""
    service = MemoryService(session)
    pref = await service.get_preference(project_id, key)
    if not pref:
        raise HTTPException(status_code=404, detail="Preference not found")
    return PreferenceResponse.model_validate(pref)


@router.delete("/projects/{project_id}/preferences/{key}", status_code=204)
async def delete_preference(
    project_id: str,
    key: str,
    session: AsyncSession = Depends(get_db),
):
    """Delete a preference."""
    service = MemoryService(session)
    deleted = await service.delete_preference(project_id, key)
    if not deleted:
        raise HTTPException(status_code=404, detail="Preference not found")
