"""
File Management API Endpoints

REST API for file and folder operations.
"""
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from database import get_db
from backend.file_service import (
    create_folder,
    upload_file,
    list_project_files,
    get_file,
    delete_file,
    get_project_file_tree
)

logger = logging.getLogger(__name__)
    create_folder,
    upload_file,
    list_project_files,
    get_file,
    delete_file,
    get_project_file_tree
)

router = APIRouter(prefix="/files", tags=["files"])


# Request/Response Models
class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_folder_id: str = Field(None)
    description: str = Field(None)


class FolderResponse(BaseModel):
    id: str
    name: str
    path: str
    description: str | None
    file_count: int
    created_at: str


class FileResponse(BaseModel):
    id: str
    name: str
    file_type: str
    path: str
    description: str | None
    size_bytes: int
    created_at: str


class FileTreeResponse(BaseModel):
    id: str
    name: str
    type: str
    path: str
    description: str | None
    fileType: str | None
    children: list = []


# Endpoints
@router.post("/projects/{project_id}/folders", response_model=FolderResponse)
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create folder: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/files/upload", response_model=FileResponse)
async def upload_project_file(
    project_id: str,
    file: UploadFile,
    folder_id: str = Query(None),
    description: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Upload a file to a project."""
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
            created_at=file_record.created_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/files", response_model=list[dict])
async def list_project_files(
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
async def get_project_file_tree(
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
    """Get file details by ID."""
    try:
        file = await get_file(db, file_id)
        return FileResponse(
            id=file.id,
            name=file.name,
            file_type=file.file_type,
            path=file.path,
            description=file.description,
            size_bytes=file.size_bytes,
            created_at=file.created_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Download a file by ID."""
    try:
        from fastapi.responses import FileResponse

        file = await get_file(db, file_id)

        if not os.path.exists(file.storage_path):
            raise HTTPException(status_code=404, detail="File not found on disk")

        return FileResponse(
            path=file.storage_path,
            filename=file.name,
            media_type=file.mime_type or "application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_id}")
async def delete_project_file(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a file."""
    try:
        await delete_file(db, file_id)
        return {"message": "File deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
