"""
SQLAlchemy Database Models for Research Pilot Orchestration Engine.

This module defines the persistence layer following the state-driven orchestration model.
All workflow execution is governed by persisted state rather than transient in-memory logic.
"""
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, JSON, Enum as SQLEnum,
    ForeignKey, UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from datetime import datetime, timezone
import uuid
import enum

Base = declarative_base()


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


# ============== Enums ==============

class ProjectStatus(str, enum.Enum):
    """Project lifecycle states."""
    CREATED = "created"
    PLANNING = "planning"
    PLANNED = "planned"
    EXECUTING = "executing"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskState(str, enum.Enum):
    """
    Task state machine states.
    State transitions are atomic and persisted in the database.
    """
    PENDING = "pending"      # Created but cannot yet be scheduled
    READY = "ready"          # All dependencies completed, may be executed
    RUNNING = "running"      # Currently executing
    WAITING = "waiting"      # Blocked on external condition
    COMPLETED = "completed"  # Executed successfully
    FAILED = "failed"        # Execution terminated with error
    CANCELLED = "cancelled"  # Explicitly cancelled


class TaskType(str, enum.Enum):
    """Types of tasks that can be executed."""
    LITERATURE_SEARCH = "literature_search"
    PDF_ACQUISITION = "pdf_acquisition"
    REFERENCE_EXTRACTION = "reference_extraction"
    SUMMARIZATION = "summarization"
    SYNTHESIS = "synthesis"
    DRAFTING = "drafting"
    AGGREGATION = "aggregation"
    VALIDATION = "validation"


class ArtifactType(str, enum.Enum):
    """Types of artifacts produced by tasks."""
    SEARCH_RESULTS = "search_results"
    PDF_CONTENT = "pdf_content"
    REFERENCE_LIST = "reference_list"
    SUMMARY = "summary"
    SYNTHESIS = "synthesis"
    DRAFT = "draft"
    FINAL_OUTPUT = "final_output"


class OutputType(str, enum.Enum):
    """Types of research outputs."""
    LITERATURE_REVIEW = "literature_review"
    RESEARCH_PAPER = "research_paper"
    RESEARCH_BRIEF = "research_brief"


# ============== Core Models ==============

class Project(Base):
    """
    Top-level unit of execution and persistence.
    All execution state, tasks, artifacts, and logs are scoped to a Project.
    """
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # User input
    research_goal = Column(Text, nullable=False)
    output_type = Column(SQLEnum(OutputType), nullable=False)
    audience = Column(String(255), nullable=True)
    
    # Lifecycle state
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.CREATED, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Aggregated counts (derived from tasks)
    task_counts = Column(JSONB, default=lambda: {
        "pending": 0, "ready": 0, "running": 0, 
        "waiting": 0, "completed": 0, "failed": 0, "cancelled": 0
    })
    
    # Relationships
    plan = relationship("Plan", back_populates="project", uselist=False, cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    artifacts = relationship("Artifact", back_populates="project", cascade="all, delete-orphan")
    execution_logs = relationship("ExecutionLog", back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_projects_status", "status"),
        Index("idx_projects_created_at", "created_at"),
    )


class Plan(Base):
    """
    Structured specification describing the intended workflow.
    The Plan is generated once per Project and is IMMUTABLE after creation.
    Plans describe logical steps and dependencies but do not represent executable tasks directly.
    """
    __tablename__ = "plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Plan specification (immutable after creation)
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=True)
    scope = Column(String(255), nullable=True)
    
    # Structured plan data
    phases = Column(JSONB, nullable=False)  # Array of phase objects with tasks
    search_terms = Column(ARRAY(String), default=list)
    key_themes = Column(ARRAY(String), default=list)
    estimated_papers = Column(Integer, default=30)
    
    # Planning metadata
    planning_model = Column(String(100), nullable=True)  # Which LLM generated this
    planning_prompt_hash = Column(String(64), nullable=True)  # For reproducibility
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="plan")

    __table_args__ = (
        Index("idx_plans_project_id", "project_id"),
    )


class Task(Base):
    """
    Smallest executable unit in the system.
    Tasks are generated by expanding the Plan into a directed acyclic graph.
    Each Task represents a single agent invocation or tool operation.
    """
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Task definition
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(SQLEnum(TaskType), nullable=False)
    
    # Execution order and grouping
    phase_index = Column(Integer, default=0)  # Which phase this task belongs to
    sequence_index = Column(Integer, default=0)  # Order within phase
    
    # State machine
    state = Column(SQLEnum(TaskState), default=TaskState.PENDING, nullable=False)
    
    # Agent/tool configuration
    agent_config = Column(JSONB, nullable=True)  # Prompt template, model, parameters
    
    # Retry handling
    max_retries = Column(Integer, default=3)
    retry_count = Column(Integer, default=0)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    error_details = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Output reference
    output_artifact_id = Column(String(36), ForeignKey("artifacts.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    output_artifact = relationship("Artifact", foreign_keys=[output_artifact_id])
    dependencies = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.dependent_task_id",
        back_populates="dependent_task",
        cascade="all, delete-orphan"
    )
    dependents = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.dependency_task_id",
        back_populates="dependency_task",
        cascade="all, delete-orphan"
    )
    runs = relationship("TaskRun", back_populates="task", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_tasks_project_id", "project_id"),
        Index("idx_tasks_state", "state"),
        Index("idx_tasks_project_state", "project_id", "state"),
    )


class TaskDependency(Base):
    """
    Explicit dependency relationships between tasks.
    Forms the edges of the directed acyclic graph.
    """
    __tablename__ = "task_dependencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # The task that depends on another
    dependent_task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    
    # The task that must complete first
    dependency_task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    dependent_task = relationship("Task", foreign_keys=[dependent_task_id], back_populates="dependencies")
    dependency_task = relationship("Task", foreign_keys=[dependency_task_id], back_populates="dependents")

    __table_args__ = (
        UniqueConstraint("dependent_task_id", "dependency_task_id", name="uq_task_dependency"),
        CheckConstraint("dependent_task_id != dependency_task_id", name="no_self_dependency"),
        Index("idx_task_deps_dependent", "dependent_task_id"),
        Index("idx_task_deps_dependency", "dependency_task_id"),
    )


class TaskRun(Base):
    """
    Individual execution of a task, including retries.
    Each run produces a new artifact rather than overwriting prior outputs.
    """
    __tablename__ = "task_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    
    # Run metadata
    run_number = Column(Integer, default=1)  # 1 for first run, 2+ for retries
    
    # State
    state = Column(SQLEnum(TaskState), default=TaskState.RUNNING, nullable=False)
    
    # Agent execution details
    model_used = Column(String(100), nullable=True)
    prompt_hash = Column(String(64), nullable=True)  # Hash of the prompt for reproducibility
    
    # Input/Output references
    input_artifact_ids = Column(ARRAY(String), default=list)
    output_artifact_id = Column(String(36), ForeignKey("artifacts.id", ondelete="SET NULL"), nullable=True)
    
    # Execution metrics
    duration_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    error_details = Column(JSONB, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    task = relationship("Task", back_populates="runs")
    output_artifact = relationship("Artifact", foreign_keys=[output_artifact_id])

    __table_args__ = (
        Index("idx_task_runs_task_id", "task_id"),
        UniqueConstraint("task_id", "run_number", name="uq_task_run_number"),
    )


class Artifact(Base):
    """
    Persisted output produced by a Task.
    Artifacts are versioned and IMMUTABLE once created.
    """
    __tablename__ = "artifacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String(36), nullable=True)  # Which task produced this
    run_id = Column(String(36), nullable=True)  # Which run produced this
    
    # Artifact metadata
    artifact_type = Column(SQLEnum(ArtifactType), nullable=False)
    title = Column(String(500), nullable=False)
    
    # Content (for text-based artifacts)
    content = Column(Text, nullable=True)
    
    # Structured metadata
    artifact_metadata = Column(JSONB, default=dict)
    
    # Versioning
    version = Column(Integer, default=1)
    parent_artifact_id = Column(String(36), ForeignKey("artifacts.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="artifacts")
    parent = relationship("Artifact", remote_side=[id])

    __table_args__ = (
        Index("idx_artifacts_project_id", "project_id"),
        Index("idx_artifacts_task_id", "task_id"),
        Index("idx_artifacts_type", "artifact_type"),
    )


class Paper(Base):
    """
    Academic paper discovered during literature search.
    """
    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # External identifiers
    external_id = Column(String(255), nullable=True)
    source = Column(String(50), nullable=False)  # semantic_scholar, arxiv
    
    # Paper metadata
    title = Column(Text, nullable=False)
    authors = Column(ARRAY(String), default=list)
    abstract = Column(Text, nullable=True)
    year = Column(Integer, nullable=True)
    citation_count = Column(Integer, nullable=True)
    
    # URLs
    url = Column(Text, nullable=True)
    pdf_url = Column(Text, nullable=True)
    
    # Processed content
    full_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=True)
    
    # Relevance scoring
    relevance_score = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_papers_project_id", "project_id"),
        Index("idx_papers_source", "source"),
    )


class Reference(Base):
    """
    Citation extracted from a paper.
    """
    __tablename__ = "references"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    
    # Reference data
    raw_text = Column(Text, nullable=False)
    authors = Column(ARRAY(String), default=list)
    title = Column(Text, nullable=True)
    year = Column(Integer, nullable=True)
    journal = Column(String(500), nullable=True)
    doi = Column(String(255), nullable=True)
    arxiv_id = Column(String(100), nullable=True)
    
    # Parsing confidence
    confidence = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_references_project_id", "project_id"),
        Index("idx_references_paper_id", "paper_id"),
    )


class ExecutionLog(Base):
    """
    Immutable log of execution events for debugging and auditing.
    """
    __tablename__ = "execution_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String(36), nullable=True)
    run_id = Column(String(36), nullable=True)
    
    # Event details
    event_type = Column(String(100), nullable=False)
    level = Column(String(20), default="info")  # debug, info, warning, error
    message = Column(Text, nullable=False)
    data = Column(JSONB, nullable=True)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="execution_logs")

    __table_args__ = (
        Index("idx_exec_logs_project_id", "project_id"),
        Index("idx_exec_logs_task_id", "task_id"),
        Index("idx_exec_logs_timestamp", "timestamp"),
    )
