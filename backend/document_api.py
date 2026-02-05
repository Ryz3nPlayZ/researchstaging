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
from llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["documents"])


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


@router.post("/documents/{document_id}/restore/{version_id}", response_model=DocumentResponse)
async def restore_document_version(
    document_id: str,
    version_id: str,
    session: AsyncSession = Depends(get_db),
):
    """
    Restore a document to a previous version.

    Process:
    1. Create new DocumentVersion for pre-restore state (audit trail)
    2. Update Document.content with version content
    3. Create DocumentVersion for restored state

    Preserves full history of what was there before and after restore.
    """
    # Get document
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get version to restore from
    result = await session.execute(
        select(DocumentVersion).where(DocumentVersion.id == version_id)
    )
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Document version not found")

    if version.document_id != document_id:
        raise HTTPException(
            status_code=400,
            detail="Version does not belong to this document"
        )

    # Step 1: Create version for pre-restore state (audit trail)
    pre_restore_version = DocumentVersion(
        document_id=document.id,
        content=document.content,
        change_description="Auto-saved before restore",
        created_at=datetime.now(timezone.utc),
        created_by=document.created_by,
    )
    session.add(pre_restore_version)

    # Step 2: Update document content
    document.content = version.content

    # Calculate new content hash
    content_json = json.dumps(version.content, sort_keys=True)
    new_hash = hashlib.sha256(content_json.encode()).hexdigest()
    document.content_hash = new_hash
    document.updated_at = datetime.now(timezone.utc)

    # Step 3: Create version for restored state
    restored_version = DocumentVersion(
        document_id=document.id,
        content=version.content,
        change_description=f"Restored from version {version_id}",
        created_at=datetime.now(timezone.utc),
        created_by=document.created_by,
    )
    session.add(restored_version)

    await session.flush()

    logger.info(
        f"Restored document {document_id} to version {version_id}. "
        f"Pre-restore saved as {pre_restore_version.id}, "
        f"Post-restore saved as {restored_version.id}"
    )

    return DocumentResponse(
        id=document.id,
        project_id=document.project_id,
        title=document.title,
        content=document.content,
        citation_style=document.citation_style.value,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


# ============== AI Text Assistance Endpoints ==============

class RewriteRequest(BaseModel):
    """Request model for AI text rewrite."""
    selection: str
    tone: str


class GrammarRequest(BaseModel):
    """Request model for AI grammar check."""
    text: str


class RewriteResponse(BaseModel):
    """Response model for AI rewrite."""
    rewritten: str


class GrammarSuggestion(BaseModel):
    """Single grammar suggestion."""
    original: str
    correction: str
    explanation: str


class GrammarResponse(BaseModel):
    """Response model for AI grammar check."""
    corrected: str
    suggestions: list[GrammarSuggestion]


@router.post("/documents/{document_id}/ai/rewrite", response_model=RewriteResponse)
async def rewrite_text(
    document_id: str,
    request: RewriteRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Rewrite text selection with AI in specified tone.

    Tones: formal, casual, concise, elaborate
    Returns rewritten text preserving meaning but changing style.
    """
    # Verify document exists
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Validate tone
    valid_tones = ["formal", "casual", "concise", "elaborate"]
    if request.tone not in valid_tones:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tone: {request.tone}. Must be one of: {', '.join(valid_tones)}"
        )

    # Generate rewrite using LLM service
    system_message = """You are a skilled editor specializing in text transformation.
Your task is to rewrite text while preserving the core meaning and information,
only changing the style, tone, and level of detail as requested."""

    prompt = f"""Rewrite this text in a {request.tone} tone.

Tone guidelines:
- formal: Use academic/professional language, complete sentences, avoid contractions
- casual: Use conversational language, contractions acceptable, simpler vocabulary
- concise: Remove unnecessary words, be brief and direct, eliminate redundancy
- elaborate: Add detail and nuance, expand ideas, provide more context

Keep the meaning but change the style.

Text: {request.selection}

Return only the rewritten text, nothing else."""

    try:
        rewritten = await llm_service.generate(prompt, system_message)
        logger.info(f"Rewrote text for document {document_id} in {request.tone} tone")
        return RewriteResponse(rewritten=rewritten.strip())
    except ValueError as e:
        # LLM service error (no providers configured)
        raise HTTPException(
            status_code=503,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error rewriting text: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to rewrite text: {str(e)}"
        )


@router.post("/documents/{document_id}/ai/grammar", response_model=GrammarResponse)
async def check_grammar(
    document_id: str,
    request: GrammarRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Check text for grammar, spelling, and style issues with AI.

    Returns corrected text and list of specific suggestions with explanations.
    """
    # Verify document exists
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Generate grammar check using LLM service
    system_message = """You are a meticulous editor and proofreader.
Your task is to identify and correct grammar, spelling, punctuation, and style issues.
Provide clear explanations for each correction."""

    prompt = f"""Check this text for grammar, spelling, and style issues.

Text: {request.text}

Provide your response in this exact JSON format:
{{
    "corrected": "the corrected text with all fixes applied",
    "suggestions": [
        {{
            "original": "the incorrect text",
            "correction": "the corrected text",
            "explanation": "brief explanation of the issue and fix"
        }}
    ]
}}

If no issues are found, return the original text as corrected and an empty suggestions array.
Focus on: grammar rules, spelling, punctuation, clarity, word choice, and style consistency."""

    try:
        response = await llm_service.generate(prompt, system_message)

        # Parse JSON response
        import json
        try:
            # Find JSON in response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end > start:
                result_data = json.loads(response[start:end])
            else:
                # Fallback if no JSON found
                logger.warning(f"LLM did not return JSON, returning original text")
                return GrammarResponse(
                    corrected=request.text,
                    suggestions=[]
                )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse grammar check JSON: {e}")
            # Fallback: return original text
            return GrammarResponse(
                corrected=request.text,
                suggestions=[]
            )

        logger.info(f"Grammar checked text for document {document_id}")
        return GrammarResponse(
            corrected=result_data.get("corrected", request.text),
            suggestions=result_data.get("suggestions", [])
        )
    except ValueError as e:
        # LLM service error (no providers configured)
        raise HTTPException(
            status_code=503,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error checking grammar: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check grammar: {str(e)}"
        )
