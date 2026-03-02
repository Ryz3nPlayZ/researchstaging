"""
Database models for the Claims Graph feature.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY

from database.models import Base


class PaperUpload(Base):
    """Uploaded PDF papers for claims extraction."""

    __tablename__ = "paper_uploads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer)

    # Processing status
    status = Column(
        String(20), default="pending"
    )  # pending, processing, completed, failed
    status_message = Column(Text, nullable=True)

    # Extracted content
    extracted_text = Column(Text, nullable=True)
    extraction_metadata = Column(JSON, default=dict)  # pages, sections, etc.

    # Stats
    claim_count = Column(Integer, default=0)
    relationship_count = Column(Integer, default=0)
    contradiction_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Indexes
    __table_args__ = (
        Index("idx_paper_upload_project", "project_id"),
        Index("idx_paper_upload_user", "user_id"),
        Index("idx_paper_upload_status", "status"),
    )


class PaperClaim(Base):
    """Individual claims extracted from papers."""

    __tablename__ = "paper_claims"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_upload_id = Column(
        String(36),
        ForeignKey("paper_uploads.id", ondelete="CASCADE"),
        nullable=False,
    )

    # The claim content
    text = Column(Text, nullable=False)  # Normalized/cleaned claim text
    quote = Column(Text, nullable=False)  # Exact text from paper

    # Classification
    claim_type = Column(
        String(20), nullable=False
    )  # fact, claim, assumption, implication
    section = Column(
        String(50), nullable=False
    )  # abstract, intro, methods, results, discussion, conclusion

    # Location in paper
    paragraph_index = Column(Integer, nullable=False)
    sentence_index = Column(Integer, nullable=True)
    page_number = Column(Integer, nullable=True)

    # Quality scores
    confidence = Column(Float, default=0.0)  # Extraction confidence 0-1
    evidence_strength = Column(Float, nullable=True)  # How well supported 0-1
    importance_score = Column(Float, default=0.0)  # Graph centrality

    # For semantic search
    embedding = Column(ARRAY(Float), nullable=True)  # Vector embedding

    # User validation
    is_valid = Column(Boolean, nullable=True)  # True = valid, False = invalid
    user_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index("idx_claim_paper", "paper_upload_id"),
        Index("idx_claim_type", "claim_type"),
        Index("idx_claim_section", "section"),
        Index("idx_claim_confidence", "confidence"),
    )


class PaperClaimRelationship(Base):
    """Relationships between claims (edges in the graph)."""

    __tablename__ = "paper_claim_relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_upload_id = Column(
        String(36),
        ForeignKey("paper_uploads.id", ondelete="CASCADE"),
        nullable=False,
    )

    source_claim_id = Column(
        String(36),
        ForeignKey("paper_claims.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_claim_id = Column(
        String(36),
        ForeignKey("paper_claims.id", ondelete="CASCADE"),
        nullable=False,
    )

    relationship_type = Column(
        String(20), nullable=False
    )  # supports, contradicts, assumes, implies, method_of

    # Detection info
    detection_method = Column(
        String(20), default="ai_inferred"
    )  # ai_explicit, ai_inferred, user_added
    confidence = Column(Float, default=0.5)  # Relationship confidence 0-1

    # Evidence
    evidence_quote = Column(Text, nullable=True)  # Text evidence

    created_at = Column(DateTime, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index("idx_rel_paper", "paper_upload_id"),
        Index("idx_rel_source", "source_claim_id"),
        Index("idx_rel_target", "target_claim_id"),
        Index("idx_rel_type", "relationship_type"),
    )


class Contradiction(Base):
    """Detected contradictions between claims."""

    __tablename__ = "claim_contradictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_upload_id = Column(
        String(36),
        ForeignKey("paper_uploads.id", ondelete="CASCADE"),
        nullable=False,
    )

    claim_1_id = Column(
        String(36),
        ForeignKey("paper_claims.id", ondelete="CASCADE"),
        nullable=False,
    )
    claim_2_id = Column(
        String(36),
        ForeignKey("paper_claims.id", ondelete="CASCADE"),
        nullable=False,
    )

    contradiction_type = Column(
        String(20), nullable=False
    )  # numerical, logical, semantic
    severity = Column(String(10), default="medium")  # low, medium, high, critical

    explanation = Column(Text, nullable=False)  # Human-readable explanation
    resolution_status = Column(
        String(20), default="open"
    )  # open, resolved, false_positive

    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Indexes
    __table_args__ = (
        Index("idx_contra_paper", "paper_upload_id"),
        Index("idx_contra_claims", "claim_1_id", "claim_2_id"),
        Index("idx_contra_status", "resolution_status"),
    )


class ClaimAnnotation(Base):
    """User annotations on claims (collaborative layer)."""

    __tablename__ = "claim_annotations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_upload_id = Column(
        String(36),
        ForeignKey("paper_uploads.id", ondelete="CASCADE"),
        nullable=False,
    )

    claim_id = Column(
        String(36),
        ForeignKey("paper_claims.id", ondelete="CASCADE"),
        nullable=True,
    )
    relationship_id = Column(
        String(36),
        ForeignKey("paper_claim_relationships.id", ondelete="CASCADE"),
        nullable=True,
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    annotation_type = Column(
        String(20), nullable=False
    )  # comment, challenge, agreement, note, clarification
    text = Column(Text, nullable=False)

    # Threading
    parent_annotation_id = Column(
        String(36), ForeignKey("claim_annotations.id"), nullable=True
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index("idx_anno_paper", "paper_upload_id"),
        Index("idx_anno_claim", "claim_id"),
        Index("idx_anno_user", "user_id"),
        Index("idx_anno_type", "annotation_type"),
    )
