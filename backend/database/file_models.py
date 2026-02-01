"""
File Management Models

Stores files and folders for project workspaces.
Supports hierarchical organization and multiple file types.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from database import Base


def generate_uuid():
    """Generate a random UUID for entity IDs."""
    import uuid
    return str(uuid.uuid4())


def utc_now():
    """Get current UTC datetime."""
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)


class Folder(Base):
    """Folder for organizing files in a project workspace."""
    __tablename__ = "folders"

    id = Column(String(36), primary_key=True, default=lambda: generate_uuid())
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_folder_id = Column(String(36), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True)

    name = Column(String(255), nullable=False)
    path = Column(String(1000), nullable=False, unique=True)  # e.g., "project_id/literature/papers"
    description = Column(Text, nullable=True)

    # Folder metadata
    file_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    project = relationship("Project", backref="folders")
    parent_folder = relationship("Folder", remote_side="Folder.id", backref="subfolders")
    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Folder {self.path}>"


class File(Base):
    """File stored in project workspace."""
    __tablename__ = "files"

    id = Column(String(36), primary_key=True, default=lambda: generate_uuid())
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(String(36), ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)

    name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, md, csv, json, py, etc.
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    path = Column(String(1000), nullable=False, unique=True)  # e.g., "project_id/literature/paper.pdf"
    description = Column(Text, nullable=True)

    # File storage
    storage_path = Column(String(1000), nullable=False)  # Where file is stored on disk/S3
    content_hash = Column(String(64), nullable=True)  # SHA-256 hash for deduplication

    # File metadata
    tags = Column(JSONB, nullable=True)  # ["ai", "literature", "data"]
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    project = relationship("Project", backref="files")
    folder = relationship("Folder", back_populates="files")

    def __repr__(self):
        return f"<File {self.name} ({self.file_type})>"