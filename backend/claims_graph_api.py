"""
API endpoints for the Claims Graph feature.
"""

import logging
import os
import shutil
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from auth_dependencies import require_auth
from claim_extraction_service import claim_extraction_service
from database import (
    ClaimAnnotation,
    Contradiction,
    PaperClaim,
    PaperClaimRelationship,
    PaperUpload,
    get_db,
)
from database.credit_models import User
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/claims-graph", tags=["claims-graph"], dependencies=[Depends(require_auth)]
)

# Storage directory - use /tmp in production (Railway), local storage in dev
STORAGE_DIR = Path(os.environ.get("STORAGE_PATH", "/tmp/claims-papers"))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
logger.info(f"Claims graph storage directory: {STORAGE_DIR}")


# ============== Pydantic Models ==============


class ClaimBase(BaseModel):
    id: str
    text: str
    quote: str
    claim_type: str
    section: str
    paragraph_index: int
    confidence: float
    evidence_strength: Optional[float] = None
    importance_score: float
    is_valid: Optional[bool] = None


class RelationshipBase(BaseModel):
    id: str
    source_id: str
    target_id: str
    relationship_type: str
    confidence: float
    detection_method: str


class ContradictionBase(BaseModel):
    id: str
    claim_1_id: str
    claim_2_id: str
    contradiction_type: str
    severity: str
    explanation: str
    resolution_status: str


class GraphData(BaseModel):
    claims: List[ClaimBase]
    relationships: List[RelationshipBase]
    contradictions: List[ContradictionBase]


class PaperUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    status_message: Optional[str]
    claim_count: int
    relationship_count: int
    contradiction_count: int
    created_at: str


class AnnotationCreate(BaseModel):
    claim_id: Optional[str] = None
    relationship_id: Optional[str] = None
    annotation_type: str = Field(
        ..., pattern="^(comment|challenge|agreement|note|clarification)$"
    )
    text: str = Field(..., min_length=1)
    parent_annotation_id: Optional[str] = None


class AnnotationResponse(BaseModel):
    id: str
    claim_id: Optional[str]
    relationship_id: Optional[str]
    user_id: str
    user_name: str
    annotation_type: str
    text: str
    created_at: str


# ============== Background Processing ==============


async def process_paper_background(upload_id: str, file_path: str):
    """Background task to process uploaded paper."""
    from database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            # Update status
            upload = await db.get(PaperUpload, upload_id)
            if not upload:
                return

            upload.status = "processing"
            upload.status_message = "Extracting text and claims..."
            await db.commit()

            # Process paper
            result = await claim_extraction_service.extract_claims_from_pdf(file_path)

            # Create claims
            claim_id_map = {}  # index -> UUID
            for idx, claim_data in enumerate(result["claims"]):
                claim = PaperClaim(
                    paper_upload_id=upload_id,
                    text=claim_data["text"],
                    quote=claim_data["quote"],
                    claim_type=claim_data["claim_type"],
                    section=claim_data["section"],
                    paragraph_index=claim_data["paragraph_index"],
                    confidence=claim_data.get("confidence", 0.5),
                    evidence_strength=claim_data.get("evidence_strength"),
                    importance_score=claim_data.get("importance_score", 0.5),
                )
                db.add(claim)
                await db.flush()  # Get ID
                claim_id_map[idx] = claim.id

            # Create relationships
            for rel_data in result["relationships"]:
                source_idx = rel_data.get("source_index")
                target_idx = rel_data.get("target_index")

                if source_idx in claim_id_map and target_idx in claim_id_map:
                    relationship = PaperClaimRelationship(
                        paper_upload_id=upload_id,
                        source_claim_id=claim_id_map[source_idx],
                        target_claim_id=claim_id_map[target_idx],
                        relationship_type=rel_data["relationship_type"],
                        confidence=rel_data.get("confidence", 0.5),
                        detection_method=rel_data.get(
                            "detection_method", "ai_inferred"
                        ),
                    )
                    db.add(relationship)

            # Create contradictions
            for contra_data in result["contradictions"]:
                idx1 = contra_data.get("claim_1_index")
                idx2 = contra_data.get("claim_2_index")

                if idx1 in claim_id_map and idx2 in claim_id_map:
                    contradiction = Contradiction(
                        paper_upload_id=upload_id,
                        claim_1_id=claim_id_map[idx1],
                        claim_2_id=claim_id_map[idx2],
                        contradiction_type=contra_data["contradiction_type"],
                        severity=contra_data["severity"],
                        explanation=contra_data["explanation"],
                    )
                    db.add(contradiction)

            # Update upload status
            upload.status = "completed"
            upload.status_message = f"Found {len(result['claims'])} claims, {len(result['relationships'])} relationships, {len(result['contradictions'])} contradictions"
            upload.claim_count = len(result["claims"])
            upload.relationship_count = len(result["relationships"])
            upload.contradiction_count = len(result["contradictions"])
            upload.extracted_text = result.get("text", "")[:10000]  # Limit storage

            await db.commit()
            logger.info(f"Paper {upload_id} processed successfully")

        except Exception as e:
            logger.exception(f"Failed to process paper {upload_id}")
            upload = await db.get(PaperUpload, upload_id)
            if upload:
                upload.status = "failed"
                upload.status_message = str(e)[:500]
                await db.commit()


# ============== API Endpoints ==============


@router.post("/upload", response_model=PaperUploadResponse)
async def upload_paper(
    background_tasks: BackgroundTasks,
    project_id: str = Query(..., description="Project ID to associate with upload"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """Upload a PDF paper and queue it for claim extraction."""
    # Validate file
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    # Save file
    upload_id = str(UUID())
    file_path = STORAGE_DIR / f"{upload_id}.pdf"

    try:
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(500, f"Failed to save file: {e}")
    finally:
        file.file.close()

    # Create upload record
    upload = PaperUpload(
        id=upload_id,
        project_id=project_id,
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(file_path),
        file_size_bytes=file_path.stat().st_size,
        status="pending",
    )
    db.add(upload)
    await db.commit()

    # Queue background processing
    background_tasks.add_task(process_paper_background, upload_id, str(file_path))

    return PaperUploadResponse(
        id=upload_id,
        filename=file.filename,
        status="pending",
        status_message="Queued for processing",
        claim_count=0,
        relationship_count=0,
        contradiction_count=0,
        created_at=upload.created_at.isoformat(),
    )


@router.get("/uploads/{upload_id}/status", response_model=PaperUploadResponse)
async def get_upload_status(
    upload_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """Get processing status of an uploaded paper."""
    upload = await db.get(PaperUpload, upload_id)
    if not upload:
        raise HTTPException(404, "Upload not found")

    # Check access
    if str(upload.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    return PaperUploadResponse(
        id=str(upload.id),
        filename=upload.filename,
        status=upload.status,
        status_message=upload.status_message,
        claim_count=upload.claim_count,
        relationship_count=upload.relationship_count,
        contradiction_count=upload.contradiction_count,
        created_at=upload.created_at.isoformat(),
    )


@router.get("/uploads", response_model=List[PaperUploadResponse])
async def list_uploads(
    project_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """List all uploads for the current user."""
    query = select(PaperUpload).where(PaperUpload.user_id == current_user.id)

    if project_id:
        query = query.where(PaperUpload.project_id == project_id)

    query = query.order_by(PaperUpload.created_at.desc())

    result = await db.execute(query)
    uploads = result.scalars().all()

    return [
        PaperUploadResponse(
            id=str(u.id),
            filename=u.filename,
            status=u.status,
            status_message=u.status_message,
            claim_count=u.claim_count,
            relationship_count=u.relationship_count,
            contradiction_count=u.contradiction_count,
            created_at=u.created_at.isoformat(),
        )
        for u in uploads
    ]


@router.get("/uploads/{upload_id}/graph", response_model=GraphData)
async def get_graph_data(
    upload_id: str,
    claim_type: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    min_confidence: float = Query(0.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """Get full graph data (claims + relationships + contradictions)."""
    upload = await db.get(PaperUpload, upload_id)
    if not upload:
        raise HTTPException(404, "Upload not found")

    if str(upload.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    if upload.status != "completed":
        raise HTTPException(400, f"Paper not ready. Status: {upload.status}")

    # Build claims query
    claims_query = select(PaperClaim).where(
        and_(
            PaperClaim.paper_upload_id == upload_id,
            PaperClaim.confidence >= min_confidence,
        )
    )

    if claim_type:
        claims_query = claims_query.where(PaperClaim.claim_type == claim_type)
    if section:
        claims_query = claims_query.where(PaperClaim.section == section)

    claims_result = await db.execute(claims_query)
    claims = claims_result.scalars().all()
    claim_ids = [str(c.id) for c in claims]

    # Get relationships for these claims
    rels_query = select(PaperClaimRelationship).where(
        and_(
            PaperClaimRelationship.paper_upload_id == upload_id,
            or_(
                PaperClaimRelationship.source_claim_id.in_(claim_ids),
                PaperClaimRelationship.target_claim_id.in_(claim_ids),
            ),
        )
    )
    rels_result = await db.execute(rels_query)
    relationships = rels_result.scalars().all()

    # Get contradictions
    contra_query = select(Contradiction).where(
        and_(
            Contradiction.paper_upload_id == upload_id,
            Contradiction.resolution_status == "open",
        )
    )
    contra_result = await db.execute(contra_query)
    contradictions = contra_result.scalars().all()

    return GraphData(
        claims=[
            ClaimBase(
                id=str(c.id),
                text=c.text,
                quote=c.quote,
                claim_type=c.claim_type,
                section=c.section,
                paragraph_index=c.paragraph_index,
                confidence=c.confidence,
                evidence_strength=c.evidence_strength,
                importance_score=c.importance_score,
                is_valid=c.is_valid,
            )
            for c in claims
        ],
        relationships=[
            RelationshipBase(
                id=str(r.id),
                source_id=str(r.source_claim_id),
                target_id=str(r.target_claim_id),
                relationship_type=r.relationship_type,
                confidence=r.confidence,
                detection_method=r.detection_method,
            )
            for r in relationships
        ],
        contradictions=[
            ContradictionBase(
                id=str(c.id),
                claim_1_id=str(c.claim_1_id),
                claim_2_id=str(c.claim_2_id),
                contradiction_type=c.contradiction_type,
                severity=c.severity,
                explanation=c.explanation,
                resolution_status=c.resolution_status,
            )
            for c in contradictions
        ],
    )


@router.get("/uploads/{upload_id}/contradictions")
async def get_contradictions(
    upload_id: str,
    severity: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """Get contradictions for a paper with full claim details."""
    upload = await db.get(PaperUpload, upload_id)
    if not upload:
        raise HTTPException(404, "Upload not found")

    if str(upload.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    query = select(Contradiction).where(
        and_(
            Contradiction.paper_upload_id == upload_id,
            Contradiction.resolution_status == "open",
        )
    )

    if severity:
        query = query.where(Contradiction.severity == severity)

    result = await db.execute(query)
    contradictions = result.scalars().all()

    # Enrich with claim details
    enriched = []
    for contra in contradictions:
        claim1 = await db.get(PaperClaim, contra.claim_1_id)
        claim2 = await db.get(PaperClaim, contra.claim_2_id)

        enriched.append(
            {
                "id": str(contra.id),
                "type": contra.contradiction_type,
                "severity": contra.severity,
                "explanation": contra.explanation,
                "claim_1": {
                    "id": str(claim1.id) if claim1 else None,
                    "text": claim1.text if claim1 else "Unknown",
                    "section": claim1.section if claim1 else "Unknown",
                },
                "claim_2": {
                    "id": str(claim2.id) if claim2 else None,
                    "text": claim2.text if claim2 else "Unknown",
                    "section": claim2.section if claim2 else "Unknown",
                },
            }
        )

    return enriched


@router.post("/claims/{claim_id}/validate")
async def validate_claim(
    claim_id: str,
    is_valid: bool,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """Mark a claim as valid or invalid (user feedback)."""
    claim = await db.get(PaperClaim, claim_id)
    if not claim:
        raise HTTPException(404, "Claim not found")

    # Check access via upload
    upload = await db.get(PaperUpload, claim.paper_upload_id)
    if str(upload.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    claim.is_valid = is_valid
    claim.user_notes = notes
    await db.commit()

    return {"success": True}


@router.get("/claims/{claim_id}/chain")
async def get_evidence_chain(
    claim_id: str,
    direction: str = Query("upstream", pattern="^(upstream|downstream|both)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """Get evidence chain for a claim (what supports it / what it supports)."""
    claim = await db.get(PaperClaim, claim_id)
    if not claim:
        raise HTTPException(404, "Claim not found")

    upload = await db.get(PaperUpload, claim.paper_upload_id)
    if str(upload.user_id) != str(current_user.id):
        raise HTTPException(403, "Access denied")

    chain = {"claim": claim, "upstream": [], "downstream": []}

    if direction in ("upstream", "both"):
        # Find what supports this claim
        result = await db.execute(
            select(PaperClaimRelationship, PaperClaim)
            .join(PaperClaim, PaperClaimRelationship.source_claim_id == PaperClaim.id)
            .where(PaperClaimRelationship.target_claim_id == claim_id)
        )
        for rel, source_claim in result:
            chain["upstream"].append({"relationship": rel, "claim": source_claim})

    if direction in ("downstream", "both"):
        # Find what this claim supports
        result = await db.execute(
            select(ClaimRelationship, PaperClaim)
            .join(PaperClaim, PaperClaimRelationship.target_claim_id == PaperClaim.id)
            .where(PaperClaimRelationship.source_claim_id == claim_id)
        )
        for rel, target_claim in result:
            chain["downstream"].append({"relationship": rel, "claim": target_claim})

    return chain


@router.post("/annotations", response_model=AnnotationResponse)
async def create_annotation(
    upload_id: str,
    data: AnnotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """Create an annotation on a claim or relationship."""
    # Verify access
    upload = await db.get(PaperUpload, upload_id)
    if not upload:
        raise HTTPException(404, "Upload not found")

    # Create annotation
    annotation = ClaimAnnotation(
        paper_upload_id=upload_id,
        claim_id=data.claim_id,
        relationship_id=data.relationship_id,
        user_id=current_user.id,
        annotation_type=data.annotation_type,
        text=data.text,
        parent_annotation_id=data.parent_annotation_id,
    )
    db.add(annotation)
    await db.commit()

    return AnnotationResponse(
        id=str(annotation.id),
        claim_id=data.claim_id,
        relationship_id=data.relationship_id,
        user_id=str(current_user.id),
        user_name=current_user.name or "Anonymous",
        annotation_type=data.annotation_type,
        text=data.text,
        created_at=annotation.created_at.isoformat(),
    )


@router.get("/annotations")
async def list_annotations(
    upload_id: str,
    claim_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    """List annotations for a paper or specific claim."""
    query = select(ClaimAnnotation).where(ClaimAnnotation.paper_upload_id == upload_id)

    if claim_id:
        query = query.where(ClaimAnnotation.claim_id == claim_id)

    query = query.order_by(ClaimAnnotation.created_at.desc())
    result = await db.execute(query)
    annotations = result.scalars().all()

    # Get user names
    user_ids = [a.user_id for a in annotations]
    users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users = {str(u.id): u for u in users_result.scalars()}

    return [
        AnnotationResponse(
            id=str(a.id),
            claim_id=str(a.claim_id) if a.claim_id else None,
            relationship_id=str(a.relationship_id) if a.relationship_id else None,
            user_id=str(a.user_id),
            user_name=users.get(str(a.user_id), User(name="Anonymous")).name
            or "Anonymous",
            annotation_type=a.annotation_type,
            text=a.text,
            created_at=a.created_at.isoformat(),
        )
        for a in annotations
    ]


@router.get("/health")
async def health_check():
    """Health check for claims graph service."""
    return {"status": "healthy", "service": "claims-graph", "version": "1.0"}
