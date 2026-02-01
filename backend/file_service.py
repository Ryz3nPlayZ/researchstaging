"""
File Service

Handles file and folder operations for project workspaces.
Supports upload, download, CRUD operations, and organization.
"""
import os
import hashlib
import logging
from typing import Optional, List
from pathlib import Path
from fastapi import UploadFile, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import Folder, File, Project, get_project
from database.models import utc_now

logger = logging.getLogger(__name__)

# Configuration
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
PROJECTS_DIR = os.path.join(UPLOAD_DIR, "projects")

# Ensure upload directory exists
os.makedirs(PROJECTS_DIR, exist_ok=True)


def _get_project_storage_path(project_id: str) -> str:
    """Get the storage path for a project."""
    return os.path.join(PROJECTS_DIR, project_id)


def _get_file_storage_path(project_id: str, file_id: str, extension: str) -> str:
    """Get the storage path for a specific file."""
    project_path = _get_project_storage_path(project_id)
    # Organize by first 2 chars of file ID for distribution
    subdir = file_id[:2]
    return os.path.join(project_path, subdir, f"{file_id}.{extension}")


async def create_folder(
    db: AsyncSession,
    project_id: str,
    name: str,
    parent_folder_id: Optional[str] = None,
    description: Optional[str] = None
) -> Folder:
    """Create a new folder in a project."""
    # Verify project exists
    project = await get_project(db, project_id)

    # Generate unique path
    parent_path = ""
    if parent_folder_id:
        parent = await db.get(Folder, parent_folder_id)
        if not parent or parent.project_id != project_id:
            raise HTTPException(status_code=400, detail="Invalid parent folder")
        parent_path = parent.path

    path = f"{parent_path}/{name}".replace("//", "/").strip("/")

    # Check for duplicate path
    existing = await db.execute(
        select(Folder).where(Folder.path == path)
    )
    if existing.first():
        raise HTTPException(status_code=400, detail=f"Folder '{path}' already exists")

    folder = Folder(
        project_id=project_id,
        parent_folder_id=parent_folder_id,
        name=name,
        path=path,
        description=description
    )
    db.add(folder)
    await db.commit()
    await db.refresh(folder)

    logger.info(f"Created folder: {path}")
    return folder


async def upload_file(
    db: AsyncSession,
    project_id: str,
    file: UploadFile,
    folder_id: Optional[str] = None,
    description: Optional[str] = None
) -> File:
    """Upload a file to a project."""
    # Verify project exists
    project = await get_project(db, project_id)

    # Determine folder path
    folder_path = ""
    if folder_id:
        folder = await db.get(Folder, folder_id)
        if not folder or folder.project_id != project_id:
            raise HTTPException(status_code=400, detail="Invalid folder")
        folder_path = folder.path

    # Generate file ID and storage path
    from database import generate_uuid
    file_id = generate_uuid()

    # Get file extension
    filename = file.filename
    _, extension = os.path.splitext(filename)
    extension = extension.lstrip(".")

    # Generate unique path
    file_name = f"{filename}"  # TODO: Handle duplicates
    path = f"{folder_path}/{file_name}".replace("//", "/").strip("/")

    # Calculate content hash
    content = await file.read()
    content_hash = hashlib.sha256(content).hexdigest()

    # Store file
    storage_path = _get_file_storage_path(project_id, file_id, extension)
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)

    with open(storage_path, "wb") as f:
        f.write(content)

    # Create file record
    file_record = File(
        id=file_id,
        project_id=project_id,
        folder_id=folder_id,
        name=filename,
        file_type=extension,
        mime_type=file.content_type,
        size_bytes=len(content),
        path=path,
        description=description,
        storage_path=storage_path,
        content_hash=content_hash
    )
    db.add(file_record)
    await db.commit()
    await db.refresh(file_record)

    logger.info(f"Uploaded file: {path} ({len(content)} bytes)")
    return file_record


async def list_project_files(
    db: AsyncSession,
    project_id: str
) -> List[dict]:
    """List all files and folders in a project."""
    # Get folders
    result = await db.execute(
        select(Folder).where(Folder.project_id == project_id)
    )
    folders = result.scalars().all()

    # Get files
    result = await db.execute(
        select(File).where(File.project_id == project_id)
    )
    files = result.scalars().all()

    # Convert to dict format
    folder_list = []
    file_list = []

    for folder in folders:
        folder_list.append({
            "id": folder.id,
            "name": folder.name,
            "type": "folder",
            "path": folder.path,
            "description": folder.description,
            "file_count": folder.file_count,
            "created_at": folder.created_at.isoformat()
        })

    for file in files:
        file_list.append({
            "id": file.id,
            "name": file.name,
            "type": "file",
            "fileType": file.file_type,
            "path": file.path,
            "description": file.description,
            "size_bytes": file.size_bytes,
            "created_at": file.created_at.isoformat()
        })

    # Organize into tree structure
    def build_tree(parent_path=""):
        tree = []
        items = [f for f in folder_list if f["path"].startswith(parent_path)]
        for item in items:
            item["children"] = build_tree(item["path"])
            tree.append(item)
        # Add files in this directory
        dir_files = [f for f in file_list if f["path"].startswith(parent_path)]
        tree.extend(dir_files)
        return tree

    # Return flat list for now (can enhance to tree later)
    return folder_list + file_list


async def get_file(
    db: AsyncSession,
    file_id: str
) -> File:
    """Get a file by ID."""
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file


async def delete_file(
    db: AsyncSession,
    file_id: str
) -> None:
    """Delete a file."""
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Delete from disk
    if os.path.exists(file.storage_path):
        os.remove(file.storage_path)

    # Delete from database
    await db.delete(file)
    await db.commit()

    logger.info(f"Deleted file: {file.path}")


async def get_project_file_tree(
    db: AsyncSession,
    project_id: str
) -> dict:
    """Get the complete file tree for a project (for FileExplorer)."""
    # Get root folders (no parent)
    result = await db.execute(
        select(Folder).where(
            Folder.project_id == project_id,
            Folder.parent_folder_id.is_(None)
        ).order_by(Folder.name)
    )
    root_folders = result.scalars().all()

    # Build tree structure
    async def build_folder_node(folder_id: str) -> dict:
        folder = await db.get(Folder, folder_id)
        if not folder:
            return None

        # Get subfolders
        subfolder_result = await db.execute(
            select(Folder).where(
                Folder.parent_folder_id == folder_id
            ).order_by(Folder.name)
        )
        subfolders = subfolder_result.scalars().all()

        # Get files in this folder
        files_result = await db.execute(
            select(File).where(File.folder_id == folder_id)
        )
        files = files_result.scalars().all()

        # Build children
        children = []

        # Add subfolders recursively
        for subfolder in subfolders:
            child_node = await build_folder_node(subfolder.id)
            if child_node:
                children.append(child_node)

        # Add files
        for file in files:
            children.append({
                "id": file.id,
                "name": file.name,
                "type": "file",
                "fileType": file.file_type,
                "path": file.path,
                "description": file.description
            })

        return {
            "id": folder.id,
            "name": folder.name,
            "type": "folder",
            "path": folder.path,
            "description": folder.description,
            "children": children
        }

    # Build root level
    tree = {
        "id": "root",
        "name": "Project Files",
        "type": "folder",
        "path": f"project_{project_id}",
        "children": []
    }

    for folder in root_folders:
        folder_node = await build_folder_node(folder.id)
        if folder_node:
            tree["children"].append(folder_node)

    # Get root-level files (no folder)
    files_result = await db.execute(
        select(File).where(
            File.project_id == project_id,
            File.folder_id.is_(None)
        )
    )
    root_files = files_result.scalars().all()

    for file in root_files:
        tree["children"].append({
            "id": file.id,
            "name": file.name,
            "type": "file",
            "fileType": file.file_type,
            "path": file.path,
            "description": file.description
        })

    return tree
