"""
Pydantic models for the Research Pilot system.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskType(str, Enum):
    LITERATURE_SEARCH = "literature_search"
    PDF_ACQUISITION = "pdf_acquisition"
    SUMMARIZATION = "summarization"
    SYNTHESIS = "synthesis"
    DRAFTING = "drafting"
    REFERENCE_EXTRACTION = "reference_extraction"
    THEMATIC_CLUSTERING = "thematic_clustering"


class OutputType(str, Enum):
    LITERATURE_REVIEW = "literature_review"
    RESEARCH_PAPER = "research_paper"


class ArtifactType(str, Enum):
    PAPER = "paper"
    SUMMARY = "summary"
    DRAFT = "draft"
    REFERENCE_LIST = "reference_list"
    SEARCH_RESULTS = "search_results"


# ============== Project Models ==============
class ProjectCreate(BaseModel):
    research_goal: str = Field(..., min_length=10)
    output_type: OutputType
    audience: Optional[str] = None


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    research_goal: str
    output_type: OutputType
    audience: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    task_counts: Dict[str, int] = Field(default_factory=lambda: {
        "pending": 0, "running": 0, "completed": 0, "failed": 0
    })


class ProjectUpdate(BaseModel):
    research_goal: Optional[str] = None
    audience: Optional[str] = None
    status: Optional[TaskStatus] = None


# ============== Task Models ==============
class TaskCreate(BaseModel):
    project_id: str
    task_type: TaskType
    name: str
    description: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list)
    input_data: Optional[Dict[str, Any]] = None


class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    task_type: TaskType
    name: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    dependencies: List[str] = Field(default_factory=list)
    input_data: Optional[Dict[str, Any]] = None
    output_artifact_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0


class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    output_artifact_id: Optional[str] = None
    error_message: Optional[str] = None


# ============== Artifact Models ==============
class ArtifactCreate(BaseModel):
    project_id: str
    task_id: str
    run_id: str
    artifact_type: ArtifactType
    title: str
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Artifact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    task_id: str
    run_id: str
    artifact_type: ArtifactType
    title: str
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============== Run Models ==============
class RunCreate(BaseModel):
    task_id: str
    project_id: str


class Run(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    project_id: str
    status: TaskStatus = TaskStatus.RUNNING
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    logs: List[str] = Field(default_factory=list)


# ============== Event Models ==============
class EventType(str, Enum):
    PROJECT_CREATED = "project_created"
    TASK_CREATED = "task_created"
    TASK_STARTED = "task_started"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    ARTIFACT_CREATED = "artifact_created"
    RUN_STARTED = "run_started"
    RUN_COMPLETED = "run_completed"


class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: EventType
    project_id: str
    task_id: Optional[str] = None
    artifact_id: Optional[str] = None
    run_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============== Literature Models ==============
class Paper(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    external_id: Optional[str] = None
    source: str  # semantic_scholar, arxiv
    title: str
    authors: List[str] = Field(default_factory=list)
    abstract: Optional[str] = None
    year: Optional[int] = None
    url: Optional[str] = None
    pdf_url: Optional[str] = None
    citation_count: Optional[int] = None
    summary: Optional[str] = None
    relevance_score: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============== SSE Event Models ==============
class SSEEvent(BaseModel):
    event: str
    data: Dict[str, Any]
