"""
Export API: REST endpoints for exporting documents to PDF/DOCX via Pandoc.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from auth_dependencies import require_auth
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database import get_db
from database.models import Document
from export_service import export_service, PandocNotFoundError, ConversionError, TimeoutError

logger = logging.getLogger(__name__)

router = APIRouter(tags=["export"], dependencies=[Depends(require_auth)])


# ============== Pydantic Models ==============

class ExportMetadata(BaseModel):
    """Optional metadata for export."""
    abstract: str | None = None
    keywords: list[str] | None = None


# ============== Export Endpoints ==============

@router.get("/documents/{document_id}/export/pdf")
async def export_document_to_pdf(
    document_id: str,
    project_id: str = Query(..., description="Project ID for ownership validation"),
    author: str | None = Query(None, description="Optional author name"),
    metadata: ExportMetadata | None = None,
    session: AsyncSession = Depends(get_db),
):
    """
    Export a document to PDF.

    Converts TipTap JSON to Markdown, then uses Pandoc with xelatex to generate PDF.

    Query params:
        project_id: Required for ownership validation
        author: Optional author name for PDF metadata
        metadata: Optional abstract and keywords

    Returns:
        FileResponse with PDF content and proper download headers

    Raises:
        404: Document not found
        403: Ownership validation failed
        503: Pandoc not available
        500: Export failed
    """
    # Get document
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Verify project ownership
    if document.project_id != project_id:
        logger.warning(
            f"Export denied: document {document_id} belongs to project "
            f"{document.project_id}, not {project_id}"
        )
        raise HTTPException(
            status_code=403,
            detail="Document does not belong to specified project"
        )

    # Prepare metadata
    export_metadata = None
    if metadata and (metadata.abstract or metadata.keywords):
        export_metadata = {
            "abstract": metadata.abstract,
            "keywords": metadata.keywords
        }

    try:
        # Export from LaTeX/Markdown source when set, else from TipTap
        if document.content_latex:
            pdf_bytes = export_service.export_to_pdf_from_source(
                source_markdown=document.content_latex,
                title=document.title,
                author=author,
                metadata=export_metadata
            )
        else:
            pdf_bytes = export_service.export_to_pdf(
                tiptap_json=document.content,
                title=document.title,
                author=author,
                metadata=export_metadata
            )

        if not pdf_bytes:
            raise HTTPException(
                status_code=500,
                detail="Export failed: no PDF generated"
            )

        # Generate safe filename
        safe_title = document.title.replace("/", "-").replace("\\", "-")[:100]
        filename = f"{safe_title}.pdf"

        logger.info(
            f"Exported document {document_id} to PDF: {filename} "
            f"({len(pdf_bytes)} bytes)"
        )

        # Return file response using StreamingResponse
        from fastapi.responses import StreamingResponse
        from io import BytesIO

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

    except PandocNotFoundError as e:
        logger.error(f"Pandoc not available: {e}")
        raise HTTPException(
            status_code=503,
            detail="Export service unavailable: Pandoc not installed"
        )
    except TimeoutError as e:
        logger.error(f"PDF export timeout: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: conversion timed out"
        )
    except ConversionError as e:
        logger.error(f"PDF conversion error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"Unexpected error during PDF export: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/documents/{document_id}/export/docx")
async def export_document_to_docx(
    document_id: str,
    project_id: str = Query(..., description="Project ID for ownership validation"),
    author: str | None = Query(None, description="Optional author name"),
    metadata: ExportMetadata | None = None,
    session: AsyncSession = Depends(get_db),
):
    """
    Export a document to DOCX.

    Converts TipTap JSON to Markdown, then uses Pandoc to generate DOCX.

    Query params:
        project_id: Required for ownership validation
        author: Optional author name for DOCX metadata
        metadata: Optional abstract and keywords

    Returns:
        FileResponse with DOCX content and proper download headers

    Raises:
        404: Document not found
        403: Ownership validation failed
        503: Pandoc not available
        500: Export failed
    """
    # Get document
    result = await session.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Verify project ownership
    if document.project_id != project_id:
        logger.warning(
            f"Export denied: document {document_id} belongs to project "
            f"{document.project_id}, not {project_id}"
        )
        raise HTTPException(
            status_code=403,
            detail="Document does not belong to specified project"
        )

    # Prepare metadata
    export_metadata = None
    if metadata and (metadata.abstract or metadata.keywords):
        export_metadata = {
            "abstract": metadata.abstract,
            "keywords": metadata.keywords
        }

    try:
        # Export to DOCX
        docx_bytes = export_service.export_to_docx(
            tiptap_json=document.content,
            title=document.title,
            author=author,
            metadata=export_metadata
        )

        if not docx_bytes:
            raise HTTPException(
                status_code=500,
                detail="Export failed: no DOCX generated"
            )

        # Generate safe filename
        safe_title = document.title.replace("/", "-").replace("\\", "-")[:100]
        filename = f"{safe_title}.docx"

        logger.info(
            f"Exported document {document_id} to DOCX: {filename} "
            f"({len(docx_bytes)} bytes)"
        )

        # Return file response using StreamingResponse
        from fastapi.responses import StreamingResponse
        from io import BytesIO

        return StreamingResponse(
            BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

    except PandocNotFoundError as e:
        logger.error(f"Pandoc not available: {e}")
        raise HTTPException(
            status_code=503,
            detail="Export service unavailable: Pandoc not installed"
        )
    except TimeoutError as e:
        logger.error(f"DOCX export timeout: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: conversion timed out"
        )
    except ConversionError as e:
        logger.error(f"DOCX conversion error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"Unexpected error during DOCX export: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/export/formats")
async def get_export_formats():
    """
    Get available export formats.

    Returns list of supported formats based on Pandoc availability.
    """
    return {
        "formats": export_service.get_supported_formats(),
        "pandoc_available": export_service.pandoc_available
    }
