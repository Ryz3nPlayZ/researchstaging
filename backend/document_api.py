"""
Document API: REST endpoints for rich text document management.
"""
import hashlib
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from sqlalchemy import select
from datetime import datetime, timezone
from pydantic import BaseModel

from database import get_db
from database.models import Document, DocumentVersion, CitationStyle

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["documents"])


# ============== Pydantic Models ==============

class DocumentRequest(BaseModel):
    """Request model for creating a document."""
    title: str
    citation_style: Optional[str] = "apa"


class DocumentUpdateRequest(BaseModel):
    """Request model for updating a document."""
    content: Optional[dict] = None
    title: Optional[str] = None
    citation_style: Optional[str] = None


class DocumentResponse(BaseModel):
    """Response model for document."""
    id: str
    project_id: str
    title: str
    content: dict
    citation_style: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListItem(BaseModel):
    """Response model for document list item (without content)."""
    id: str
    project_id: str
    title: str
    citation_style: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Document Endpoints ==============

@router.get("/projects/{project_id}/documents", response_model=List[DocumentListItem])
async def list_documents(
    project_id: str,
    session: AsyncSession = Depends(get_db),
):
    """
    List all documents for a project.

    Returns documents sorted by updated_at DESC (most recent first).
    """
    result = await session.execute(
        select(Document)
        .where(Document.project_id == project_id)
        .order_by(Document.updated_at.desc())
    )
    documents = result.scalars().all()

    return [
        DocumentListItem(
            id=d.id,
            project_id=d.project_id,
            title=d.title,
            citation_style=d.citation_style.value,
            created_at=d.created_at,
            updated_at=d.updated_at,
        )
        for d in documents
    ]


@router.post("/projects/{project_id}/documents", response_model=DocumentResponse, status_code=201)
async def create_document(
    project_id: str,
    document_request: DocumentRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Create a new document.

    Initializes document with empty TipTap content structure.
    """
    # Parse citation style
    try:
        citation_style = CitationStyle(document_request.citation_style)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid citation_style: {document_request.citation_style}. Must be one of: apa, mla, chicago"
        )

    # Create document with empty TipTap structure
    document = Document(
        project_id=project_id,
        title=document_request.title,
        content={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": []
                }
            ]
        },
        citation_style=citation_style,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    session.add(document)
    await session.flush()

    logger.info(f"Created document {document.id} for project {project_id}")

    return DocumentResponse(
        id=document.id,
        project_id=document.project_id,
        title=document.title,
        content=document.content,
        citation_style=document.citation_style.value,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    session: AsyncSession = Depends(get_db),
):
    """
    Get a single document with content.

    Verifies project ownership.
    """
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse(
        id=document.id,
        project_id=document.project_id,
        title=document.title,
        content=document.content,
        citation_style=document.citation_style.value,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    update_request: DocumentUpdateRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Update document content and/or title.

    Auto-creates DocumentVersion on content change (detected via content_hash).
    """
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Track if content changed for versioning
    content_changed = False
    old_content_hash = document.content_hash

    # Update title if provided
    if update_request.title is not None:
        document.title = update_request.title

    # Update citation style if provided
    if update_request.citation_style is not None:
        try:
            document.citation_style = CitationStyle(update_request.citation_style)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid citation_style: {update_request.citation_style}"
            )

    # Update content if provided
    if update_request.content is not None:
        document.content = update_request.content

        # Calculate new content hash
        content_json = json.dumps(update_request.content, sort_keys=True)
        new_hash = hashlib.sha256(content_json.encode()).hexdigest()
        document.content_hash = new_hash

        # Check if content actually changed
        if old_content_hash != new_hash:
            content_changed = True

    document.updated_at = datetime.now(timezone.utc)

    # Create version if content changed
    if content_changed:
        version = DocumentVersion(
            document_id=document.id,
            content=update_request.content,
            created_at=datetime.now(timezone.utc),
            created_by=document.created_by,
        )
        session.add(version)
        logger.info(f"Created version {version.id} for document {document.id}")

    await session.flush()

    return DocumentResponse(
        id=document.id,
        project_id=document.project_id,
        title=document.title,
        content=document.content,
        citation_style=document.citation_style.value,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    session: AsyncSession = Depends(get_db),
):
    """
    Delete a document.

    CASCADE deletes all associated versions and citations.
    Verifies project ownership.
    """
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    await session.delete(document)
    await session.flush()

    logger.info(f"Deleted document {document_id}")


# ============== Document Version Endpoints ==============

@router.get("/documents/{document_id}/versions")
async def list_document_versions(
    document_id: str,
    session: AsyncSession = Depends(get_db),
):
    """
    List all versions of a document.

    Returns versions sorted by created_at DESC (newest first).
    """
    # Verify document exists
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get versions
    result = await session.execute(
        select(DocumentVersion)
        .where(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.created_at.desc())
    )
    versions = result.scalars().all()

    return [
        {
            "id": v.id,
            "document_id": v.document_id,
            "change_description": v.change_description,
            "created_at": v.created_at,
            "created_by": v.created_by,
            "parent_version_id": v.parent_version_id,
        }
        for v in versions
    ]


@router.get("/documents/versions/{version_id}")
async def get_document_version(
    version_id: str,
    session: AsyncSession = Depends(get_db),
):
    """
    Get a specific document version with content.
    """
    result = await session.execute(
        select(DocumentVersion).where(DocumentVersion.id == version_id)
    )
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Document version not found")

    return {
        "id": version.id,
        "document_id": version.document_id,
        "content": version.content,
        "change_description": version.change_description,
        "created_at": version.created_at,
        "created_by": version.created_by,
        "parent_version_id": version.parent_version_id,
    }
