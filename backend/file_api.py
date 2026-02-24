"""
File Management API Endpoints

REST API for file and folder operations.
"""
import os
import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Query
from auth_dependencies import require_auth
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from database import get_db
from file_service import (
    create_folder,
    upload_file,
    list_project_files,
    get_file,
    delete_file,
    get_project_file_tree,
    rename_folder,
    delete_folder,
    move_file,
    read_file_content,
    markdown_to_tiptap,
    docx_to_tiptap,
    FileServiceError,
    UnsupportedFileTypeError,
    FileTooLargeError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["files"], dependencies=[Depends(require_auth)])


# ============== Request/Response Models ==============

class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_folder_id: Optional[str] = Field(None)
    description: Optional[str] = Field(None)


class FolderResponse(BaseModel):
    id: str
    name: str
    path: str
    description: Optional[str]
    file_count: int
    created_at: str


class FileResponse(BaseModel):
    id: str
    name: str
    file_type: str
    path: str
    description: Optional[str]
    size_bytes: int
    mime_type: Optional[str]
    created_at: str
    metadata: Optional[dict] = Field(None)


class FileTreeResponse(BaseModel):
    id: str
    name: str
    type: str
    path: str
    description: Optional[str]
    fileType: Optional[str] = Field(None)
    size_bytes: Optional[int] = Field(None)
    mime_type: Optional[str] = Field(None)
    metadata: Optional[dict] = Field(None)
    children: list = Field(default_factory=list)


class ErrorResponse(BaseModel):
    detail: str
    error_type: Optional[str] = Field(None)


# ============== Helper Functions ==============

def _handle_file_service_error(e: FileServiceError) -> HTTPException:
    """Convert FileServiceError to appropriate HTTP response."""
    if isinstance(e, UnsupportedFileTypeError):
        return HTTPException(
            status_code=400,
            detail={"error_type": "unsupported_file_type", "detail": e.detail}
        )
    elif isinstance(e, FileTooLargeError):
        return HTTPException(
            status_code=413,
            detail={"error_type": "file_too_large", "detail": e.detail}
        )
    else:
        return HTTPException(
            status_code=e.status_code,
            detail={"error_type": "file_service_error", "detail": e.detail}
        )


# ============== Endpoints ==============

@router.post(
    "/projects/{project_id}/folders",
    response_model=FolderResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}}
)
async def create_project_folder(
    project_id: str,
    data: FolderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new folder in a project."""
    try:
        folder = await create_folder(
            db=db,
            project_id=project_id,
            name=data.name,
            parent_folder_id=data.parent_folder_id,
            description=data.description
        )
        return FolderResponse(
            id=folder.id,
            name=folder.name,
            path=folder.path,
            description=folder.description,
            file_count=folder.file_count,
            created_at=folder.created_at.isoformat()
        )
    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except Exception as e:
        logger.error(f"Failed to create folder: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/projects/{project_id}/files/upload",
    response_model=FileResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        413: {"model": ErrorResponse}
    }
)
async def upload_project_file(
    project_id: str,
    file: UploadFile,
    folder_id: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file to a project.

    Supported file types: PDF, DOCX, MD, PY, R, JS, CSV, XLSX
    Maximum file size: 50MB (configurable via MAX_FILE_SIZE env var)

    Duplicate files are automatically renamed with a counter: file (1).ext
    """
    try:
        file_record = await upload_file(
            db=db,
            project_id=project_id,
            file=file,
            folder_id=folder_id,
            description=description
        )

        return FileResponse(
            id=file_record.id,
            name=file_record.name,
            file_type=file_record.file_type,
            path=file_record.path,
            description=file_record.description,
            size_bytes=file_record.size_bytes,
            mime_type=file_record.mime_type,
            created_at=file_record.created_at.isoformat(),
            metadata=file_record.tags if file_record.tags else None
        )
    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except Exception as e:
        logger.error(f"Failed to upload file: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error_type": "internal_error", "detail": str(e)}
        )


@router.get("/projects/{project_id}/files", response_model=list[dict])
async def list_project_files_endpoint(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """List all files and folders in a project."""
    try:
        files = await list_project_files(db, project_id)
        return files
    except Exception as e:
        logger.error(f"Failed to list files: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/files/tree", response_model=FileTreeResponse)
async def get_project_file_tree_endpoint(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get the complete file tree for a project (for FileExplorer)."""
    try:
        tree = await get_project_file_tree(db, project_id)
        return tree
    except Exception as e:
        logger.error(f"Failed to get file tree: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{file_id}", response_model=FileResponse)
async def get_file_details(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get file details by ID including metadata."""
    try:
        file = await get_file(db, file_id)
        return FileResponse(
            id=file.id,
            name=file.name,
            file_type=file.file_type,
            path=file.path,
            description=file.description,
            size_bytes=file.size_bytes,
            mime_type=file.mime_type,
            created_at=file.created_at.isoformat(),
            metadata=file.tags if file.tags else None
        )
    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except Exception as e:
        logger.error(f"Failed to get file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    disposition: str = "attachment",
    db: AsyncSession = Depends(get_db)
):
    """
    Download a file by ID.

    Query parameters:
    - disposition: "attachment" (default, forces download) or "inline" (for viewing in browser)

    For S3/R2 storage: Returns a JSON response with a presigned URL
    For local storage: Streams the file directly
    """
    try:
        from fastapi.responses import FileResponse, JSONResponse
        from storage_service import get_storage

        file = await get_file(db, file_id)
        storage = get_storage()

        # Check if storage backend is S3/R2 (has presigned URLs)
        backend_type = type(storage).__name__

        if backend_type == "S3StorageBackend":
            # For S3/R2, generate presigned URL
            try:
                # Extract storage key from storage_path
                # storage_path format: uploads/projects/{project_id}/{subdir}/{file_id}.{ext}
                # storage_key format: projects/{project_id}/{subdir}/{file_id}.{ext}
                storage_key = file.storage_path.replace("uploads/", "") if file.storage_path.startswith("uploads/") else file.storage_path

                # Generate presigned URL (expires in 1 hour)
                download_url = await storage.get_file_url(storage_key, expires_in=3600)

                # Return JSON with presigned URL
                return JSONResponse({
                    "download_url": download_url,
                    "filename": file.name,
                    "mime_type": file.mime_type or "application/octet-stream",
                    "expires_in": 3600
                })
            except Exception as e:
                logger.error(f"Failed to generate presigned URL: {e}")
                # Fall through to try local file serving
        elif backend_type == "LocalStorageBackend":
            # For local storage, serve file directly
            if not os.path.exists(file.storage_path):
                logger.error(f"File not found on disk: {file.storage_path}")
                raise HTTPException(status_code=404, detail="File not found on disk")

            logger.info(f"Downloading file: {file.path} from {file.storage_path}")
            return FileResponse(
                path=file.storage_path,
                filename=file.name,
                media_type=file.mime_type or "application/octet-stream",
                content_disposition_type=disposition
            )
        else:
            # Unknown storage backend
            logger.error(f"Unknown storage backend type: {backend_type}")
            raise HTTPException(status_code=500, detail="Storage backend not configured")

    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{file_id}/content", responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}})
async def get_file_content(
    file_id: str,
    project_id: str = Query(..., description="Project ID for ownership validation"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get file content as text for document editor.

    Supports .md and .docx files. Returns TipTap JSON format for editor initialization.
    Validates project ownership before returning content.

    Query parameters:
    - project_id: Required for ownership validation
    """
    try:
        # Import functions from file_service
        from file_service import read_file_content, FileServiceError, markdown_to_tiptap, docx_to_tiptap

        # Read file content (validates ownership internally)
        content_data = await read_file_content(db, file_id, project_id)

        # Get file details to determine extension
        file = await get_file(db, file_id)
        ext = file.name.split('.')[-1].lower() if '.' in file.name else ''

        # For .md files, convert Markdown to TipTap JSON
        if ext == 'md':
            tiptap_json = markdown_to_tiptap(content_data["content"])

            logger.info(f"Retrieved and converted Markdown content for file: {file.name}")

            return {
                "file_id": file_id,
                "content": content_data["content"],
                "tiptap": tiptap_json,
                "extension": ext,
                "encoding": content_data.get("encoding", "utf-8"),
                "format": "tiptap"
            }

        # For .docx files, we need special handling (binary format)
        elif ext == 'docx':
            # For DOCX, we need to read the file as bytes
            from storage_service import get_storage
            storage = get_storage()

            if hasattr(storage, '__class__') and 'LocalStorage' in storage.__class__.__name__:
                if not os.path.exists(file.storage_path):
                    logger.error(f"File not found on disk: {file.storage_path}")
                    raise HTTPException(status_code=404, detail="File not found on disk")

                # Read DOCX as bytes
                with open(file.storage_path, 'rb') as f:
                    content_bytes = f.read()

                # Convert DOCX to TipTap JSON
                tiptap_json = docx_to_tiptap(content_bytes)

                logger.info(f"Retrieved and parsed DOCX content for file: {file.name}")

                return {
                    "file_id": file_id,
                    "tiptap": tiptap_json,
                    "extension": ext,
                    "format": "tiptap"
                }
            else:
                # Cloud storage DOCX handling
                raise HTTPException(
                    status_code=501,
                    detail="DOCX file content extraction not yet implemented for cloud storage. Please use local storage."
                )

        else:
            # For other text file types, return raw content
            return {
                "file_id": file_id,
                "content": content_data["content"],
                "extension": ext,
                "encoding": content_data.get("encoding", "utf-8"),
                "format": "raw"
            }

    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file content: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class ParseRequest(BaseModel):
    content: str = Field(..., description="File content as text")
    extension: str = Field(..., description="File extension (e.g., 'md', 'docx')")


@router.post("/files/parse/tiptap", responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}})
async def parse_file_to_tiptap(
    data: ParseRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Parse file content and convert to TipTap JSON format.

    Supports .md and .docx files. Returns TipTap JSON structure for document editor initialization.

    For .md files: Converts Markdown to TipTap JSON
    For .docx files: Converts Word document to TipTap JSON (requires bytes in future enhancement)
    """
    try:
        extension = data.extension.lower()
        content = data.content

        if extension == 'md':
            # Convert Markdown to TipTap
            tiptap_json = markdown_to_tiptap(content)

            return {
                "tiptap": tiptap_json,
                "format": "markdown"
            }

        elif extension == 'docx':
            # For now, return simple structure for DOCX
            # Full DOCX parsing requires reading file bytes, which will be added in future
            logger.warning("DOCX parsing via content endpoint not yet fully implemented")
            return {
                "tiptap": {
                    "type": "doc",
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": content}]}]
                },
                "format": "docx",
                "note": "Full DOCX parsing requires file bytes. Use file-based endpoint when available."
            }

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type for TipTap parsing: {extension}. Only .md and .docx are supported."
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to parse file to TipTap: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_id}", responses={404: {"model": ErrorResponse}})
async def delete_project_file(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a file."""
    try:
        await delete_file(db, file_id)
        return {"message": "File deleted successfully"}
    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except Exception as e:
        logger.error(f"Failed to delete file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch(
    "/folders/{folder_id}/rename",
    response_model=FolderResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}}
)
async def rename_project_folder(
    folder_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Rename a folder."""
    try:
        new_name = data.get("name")
        if not new_name:
            raise HTTPException(status_code=400, detail="Name is required")

        folder = await rename_folder(db, folder_id, new_name)
        return FolderResponse(
            id=folder.id,
            name=folder.name,
            path=folder.path,
            description=folder.description,
            file_count=folder.file_count,
            created_at=folder.created_at.isoformat()
        )
    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except Exception as e:
        logger.error(f"Failed to rename folder: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/folders/{folder_id}",
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}}
)
async def delete_project_folder(
    folder_id: str,
    recursive: bool = Query(False, description="Delete folder and all contents"),
    db: AsyncSession = Depends(get_db)
):
    """Delete a folder."""
    try:
        await delete_folder(db, folder_id, recursive=recursive)
        return {"message": "Folder deleted successfully"}
    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except Exception as e:
        logger.error(f"Failed to delete folder: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch(
    "/files/{file_id}/move",
    response_model=FileResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}}
)
async def move_project_file(
    file_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Move a file to a different folder."""
    try:
        target_folder_id = data.get("folder_id")
        file = await move_file(db, file_id, target_folder_id)
        return FileResponse(
            id=file.id,
            name=file.name,
            file_type=file.file_type,
            path=file.path,
            description=file.description,
            size_bytes=file.size_bytes,
            mime_type=file.mime_type,
            created_at=file.created_at.isoformat(),
            metadata=file.tags if file.tags else None
        )
    except FileServiceError as e:
        raise _handle_file_service_error(e)
    except Exception as e:
        logger.error(f"Failed to move file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch(
    "/files/{file_id}/tags",
    response_model=FileResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}}
)
async def update_file_tags(
    file_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Update file tags metadata."""
    try:
        from database.models import File
        from sqlalchemy import update

        # Get file
        result = await db.execute(select(File).where(File.id == file_id))
        file = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Update tags
        new_tags = data.get("tags", {})
        file.tags = new_tags
        file.updated_at = datetime.now(timezone.utc)

        await db.flush()

        logger.info(f"Updated tags for file {file_id}")

        return FileResponse(
            id=file.id,
            name=file.name,
            file_type=file.file_type,
            path=file.path,
            description=file.description,
            size_bytes=file.size_bytes,
            mime_type=file.mime_type,
            created_at=file.created_at.isoformat(),
            metadata=file.tags if file.tags else None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update file tags: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
