"""
Research Pilot - AI-Native Research Execution System
FastAPI Backend Server with PostgreSQL, Redis, WebSocket, and Advanced Orchestration

This system follows a state-driven orchestration model where all workflow execution
is governed by persisted state rather than transient in-memory logic.
"""
from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends, WebSocket, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import os
import logging
import asyncio
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import json

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database imports
from database import (
    get_db, init_db, close_db,
    Project, Plan, Task, TaskDependency, TaskRun, Artifact, Paper, Reference, ExecutionLog,
    ProjectStatus, TaskState, TaskType, ArtifactType, OutputType
)

# Orchestration imports
from orchestration import orchestration_engine

# Worker imports
from workers import task_worker

# Realtime imports
from realtime import connection_manager, websocket_endpoint

# Service imports
from llm_service import llm_service
from export_service import export_service
from auth_service import auth_service

# File management imports
from backend.file_api import router as file_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Research Pilot API",
    version="3.0.0",
    description="AI-Native Research Execution System with Advanced Orchestration"
)

# Create API router
api_router = APIRouter(prefix="/api")


# ============== Pydantic Models ==============

class ProjectCreate(BaseModel):
    research_goal: str = Field(..., min_length=10)
    output_type: str
    audience: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    research_goal: str
    output_type: str
    audience: Optional[str]
    status: str
    task_counts: Dict[str, int]
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class PlanCreate(BaseModel):
    title: str
    summary: Optional[str] = None
    scope: Optional[str] = None
    phases: List[Dict[str, Any]]
    search_terms: List[str] = []
    key_themes: List[str] = []
    estimated_papers: int = 30


class PlanResponse(BaseModel):
    id: str
    project_id: str
    title: str
    summary: Optional[str]
    scope: Optional[str]
    phases: List[Dict[str, Any]]
    search_terms: List[str]
    key_themes: List[str]
    estimated_papers: int
    created_at: datetime

    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    id: str
    project_id: str
    name: str
    description: Optional[str]
    task_type: str
    state: str
    phase_index: int
    sequence_index: int
    retry_count: int
    max_retries: int
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    output_artifact_id: Optional[str]

    class Config:
        from_attributes = True


class ArtifactResponse(BaseModel):
    id: str
    project_id: str
    task_id: Optional[str]
    run_id: Optional[str]
    artifact_type: str
    title: str
    content: Optional[str]
    metadata: Dict[str, Any]
    version: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaperResponse(BaseModel):
    id: str
    project_id: str
    source: str
    title: str
    authors: List[str]
    abstract: Optional[str]
    year: Optional[int]
    citation_count: Optional[int]
    url: Optional[str]
    pdf_url: Optional[str]
    summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PlanningAnswers(BaseModel):
    current_step: Optional[str] = None
    answers: Dict[str, Any]


class PlanApproval(BaseModel):
    answers: Dict[str, Any]
    plan: Dict[str, Any]


class ExportRequest(BaseModel):
    format: str
    title: Optional[str] = None
    author: Optional[str] = None


class AIActionRequest(BaseModel):
    action: str
    content: str
    context: Optional[str] = None


class LoginRequest(BaseModel):
    code: Optional[str] = None  # For Google OAuth
    email: Optional[str] = None  # For mock auth
    name: Optional[str] = None  # For mock auth


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    picture_url: Optional[str]
    credits_remaining: float


class LoginResponse(BaseModel):
    user: UserResponse
    token: str


# ============== Startup/Shutdown Events ==============

@app.on_event("startup")
async def startup_event():
    """Initialize database and start background services."""
    logger.info("Starting Research Pilot API...")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Start task worker in background
    asyncio.create_task(task_worker.run_worker_loop())
    logger.info("Task worker started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources."""
    logger.info("Shutting down Research Pilot API...")
    task_worker.stop()
    await connection_manager.close()
    await close_db()


# ============== WebSocket Endpoint ==============

@app.websocket("/ws/{project_id}")
async def websocket_route(websocket: WebSocket, project_id: str):
    """WebSocket endpoint for real-time project updates."""
    await websocket_endpoint(websocket, project_id)


# ============== Health Check ==============

@api_router.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "message": "Research Pilot API",
        "status": "healthy",
        "version": "3.0.0",
        "features": ["postgresql", "redis", "websocket", "orchestration"]
    }


# ============== Auth Endpoints ==============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with Google OAuth code or mock credentials."""
    try:
        # Mock authentication for local development
        if data.email:
            result = await auth_service.mock_authenticate_user(data.email, data.name, db)
            return LoginResponse(
                user=UserResponse(**result["user"]),
                token=result["token"]
            )
        # Google OAuth (commented out until domain is available)
        # elif data.code:
        #     result = await auth_service.authenticate_user(data.code, db)
        #     return LoginResponse(
        #         user=UserResponse(**result["user"]),
        #         token=result["token"]
        #     )
        else:
            raise HTTPException(status_code=400, detail="Email required for mock authentication")
    except Exception as e:
        logger.error(f"Login failed: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail=str(e))


@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated user."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Extract token from "Bearer <token>" format
    if authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        token = authorization

    user = await auth_service.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture_url=user.picture_url,
        credits_remaining=round(user.credits_remaining, 2)
    )


@api_router.post("/auth/logout")
async def logout():
    """Logout user (client-side token deletion)."""
    return {"message": "Logged out successfully"}


@api_router.get("/auth/google-url")
async def get_google_auth_url():
    """Get Google OAuth authorization URL (disabled for mock auth)."""
    # Google OAuth disabled - using mock authentication for local development
    # Uncomment when domain is available for production OAuth
    # try:
    #     auth_url = auth_service.get_google_auth_url()
    #     return {"auth_url": auth_url}
    # except Exception as e:
    #     logger.error(f"Failed to generate Google auth URL: {e}")
    #     raise HTTPException(status_code=500, detail=str(e))
    return {"auth_url": None, "message": "Google OAuth disabled - using mock authentication"}


# ============== Planning Endpoints ==============

@api_router.post("/planning/generate-plan")
async def generate_research_plan(data: PlanningAnswers, db: AsyncSession = Depends(get_db)):
    """Generate a research plan using LLM."""
    plan = await llm_service.generate_research_plan(
        data.answers.get("research_goal", ""),
        data.answers.get("output_type", "literature_review"),
        data.answers.get("audience")
    )
    return plan


@api_router.post("/planning/approve")
async def approve_plan_and_create_project(
    data: PlanApproval,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Approve plan and create project with tasks."""
    try:
        logger.info(f"Approving plan with answers: {data.answers}")

        answers = data.answers
        plan_data = data.plan

        # Create project
        project = Project(
            research_goal=answers.get("research_goal", ""),
            output_type=OutputType(answers.get("output_type", "literature_review")),
            audience=answers.get("audience"),
            status=ProjectStatus.PLANNED
        )
        db.add(project)
        await db.flush()
        logger.info(f"Created project {project.id}")

        # Create immutable plan
        plan = Plan(
            project_id=project.id,
            title=plan_data.get("title", project.research_goal[:100]),
            summary=plan_data.get("summary"),
            scope=plan_data.get("scope"),
            phases=plan_data.get("phases", []),
            search_terms=plan_data.get("search_terms", []),
            key_themes=plan_data.get("key_themes", []),
            estimated_papers=plan_data.get("estimated_papers", 30)
        )
        db.add(plan)
        await db.flush()
        logger.info(f"Created plan {plan.id} for project {project.id}")

        # Expand plan into tasks
        logger.info(f"Expanding plan to tasks for project {project.id}...")
        tasks = await orchestration_engine.expand_plan_to_tasks(db, project.id, plan)
        logger.info(f"Created {len(tasks)} tasks for project {project.id}")

        await db.commit()
        logger.info(f"Successfully created project {project.id} with plan {plan.id}")

        return {
            "project_id": str(project.id),
            "plan_id": str(plan.id),
            "message": "Project created successfully"
        }

    except Exception as e:
        logger.error(f"Failed to create project: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create project: {str(e)}"
        )


# ============== Project Endpoints ==============

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_input: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create a new project (simple flow without guided planning)."""
    try:
        logger.info(f"Creating project: {project_input.research_goal}")

        project = Project(
            research_goal=project_input.research_goal,
            output_type=OutputType(project_input.output_type),
            audience=project_input.audience,
            status=ProjectStatus.CREATED
        )
        db.add(project)
        await db.flush()
        logger.info(f"Created project {project.id}")

        # Generate default plan
        default_plan = Plan(
            project_id=project.id,
            title=f"Research: {project_input.research_goal[:80]}",
            summary=f"Automated research on: {project_input.research_goal}",
            phases=[
                {
                    "name": "Discovery",
                    "tasks": [
                        {"name": "Literature Search", "type": "literature_search", "description": "Search academic databases", "dependencies": []},
                        {"name": "PDF Acquisition", "type": "pdf_acquisition", "description": "Download available PDFs", "dependencies": ["Literature Search"]},
                    ]
                },
                {
                    "name": "Analysis",
                    "tasks": [
                        {"name": "Reference Extraction", "type": "reference_extraction", "description": "Extract citations", "dependencies": ["PDF Acquisition"]},
                        {"name": "Summarization", "type": "summarization", "description": "Summarize papers", "dependencies": ["PDF Acquisition"]},
                    ]
                },
                {
                    "name": "Synthesis",
                    "tasks": [
                        {"name": "Literature Synthesis", "type": "synthesis", "description": "Synthesize findings", "dependencies": ["Summarization"]},
                    ]
                },
                {
                    "name": "Output",
                    "tasks": [
                        {"name": "Document Drafting", "type": "drafting", "description": "Draft final document", "dependencies": ["Literature Synthesis"]},
                    ]
                }
            ],
            estimated_papers=30
        )
        db.add(default_plan)
        await db.flush()
        logger.info(f"Created default plan {default_plan.id}")

        # Expand plan into tasks
        logger.info(f"Expanding plan to tasks for project {project.id}...")
        tasks = await orchestration_engine.expand_plan_to_tasks(db, project.id, default_plan)
        logger.info(f"Created {len(tasks)} tasks for project {project.id}")

        project.status = ProjectStatus.PLANNED
        await db.commit()
        await db.refresh(project)
        logger.info(f"Successfully created project {project.id}")

        return ProjectResponse(
            id=project.id,
            research_goal=project.research_goal,
            output_type=project.output_type.value,
            audience=project.audience,
            status=project.status.value,
            task_counts=project.task_counts or {},
            created_at=project.created_at,
            updated_at=project.updated_at,
            started_at=project.started_at,
            completed_at=project.completed_at
        )

    except Exception as e:
        logger.error(f"Failed to create project: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create project: {str(e)}"
        )


@api_router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    """List all projects."""
    result = await db.execute(
        select(Project).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    
    return [
        ProjectResponse(
            id=p.id,
            research_goal=p.research_goal,
            output_type=p.output_type.value,
            audience=p.audience,
            status=p.status.value,
            task_counts=p.task_counts or {},
            created_at=p.created_at,
            updated_at=p.updated_at,
            started_at=p.started_at,
            completed_at=p.completed_at
        )
        for p in projects
    ]


@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse(
        id=project.id,
        research_goal=project.research_goal,
        output_type=project.output_type.value,
        audience=project.audience,
        status=project.status.value,
        task_counts=project.task_counts or {},
        created_at=project.created_at,
        updated_at=project.updated_at,
        started_at=project.started_at,
        completed_at=project.completed_at
    )


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a project and all related data."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(project)
    await db.commit()
    
    return {"message": "Project deleted successfully"}


@api_router.post("/projects/{project_id}/execute")
async def execute_project(
    project_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Start executing all tasks in a project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update project status
    project.status = ProjectStatus.EXECUTING
    project.started_at = datetime.now(timezone.utc)
    
    # Get all ready tasks and enqueue them
    ready_tasks = await orchestration_engine.get_ready_tasks(db, project_id)
    
    for task in ready_tasks:
        await task_worker.enqueue_task(task.id, project_id)
    
    await db.commit()
    
    # Publish event
    await connection_manager.publish_event(project_id, "execution_started", {
        "project_id": project_id,
        "tasks_queued": len(ready_tasks)
    })
    
    return {
        "message": "Execution started",
        "project_id": project_id,
        "tasks_queued": len(ready_tasks)
    }


# Legacy endpoint for compatibility
@api_router.post("/projects/{project_id}/execute-all")
async def execute_all_tasks(
    project_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Execute all tasks (alias for execute)."""
    return await execute_project(project_id, background_tasks, db)


# ============== Task Endpoints ==============

@api_router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def list_project_tasks(project_id: str, db: AsyncSession = Depends(get_db)):
    """List all tasks for a project."""
    result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id)
        .order_by(Task.phase_index, Task.sequence_index)
    )
    tasks = result.scalars().all()
    
    return [
        TaskResponse(
            id=t.id,
            project_id=t.project_id,
            name=t.name,
            description=t.description,
            task_type=t.task_type.value,
            state=t.state.value,
            phase_index=t.phase_index,
            sequence_index=t.sequence_index,
            retry_count=t.retry_count,
            max_retries=t.max_retries,
            error_message=t.error_message,
            created_at=t.created_at,
            updated_at=t.updated_at,
            started_at=t.started_at,
            completed_at=t.completed_at,
            output_artifact_id=t.output_artifact_id
        )
        for t in tasks
    ]


@api_router.get("/projects/{project_id}/task-graph")
async def get_task_graph(project_id: str, db: AsyncSession = Depends(get_db)):
    """Get task DAG for visualization."""
    return await orchestration_engine.get_task_dag(db, project_id)


@api_router.get("/projects/{project_id}/agent-graph")
async def get_agent_graph(project_id: str, db: AsyncSession = Depends(get_db)):
    """Get agent orchestration graph showing multi-agent architecture."""

    # Get task states for agent status
    result = await db.execute(
        select(Task.task_type, Task.state)
        .where(Task.project_id == project_id)
    )
    task_states = {row[0]: row[1] for row in result.all()}

    # Define agent hierarchy based on agentteam.md
    agents = [
        # Orchestrator (top level)
        {"id": "orchestrator", "name": "Orchestrator", "type": "orchestrator", "description": "Main session coordination and planning"},

        # Executor agents
        {"id": "executor", "name": "Executor Agents", "type": "executor", "description": "Execute PLAN.md files atomically"},

        # Verifier agents
        {"id": "verifier", "name": "Verifier Agents", "type": "verifier", "description": "Verify phase goals against codebase"},

        # Specialist agents (on-demand)
        {"id": "mapper", "name": "Codebase Mapper", "type": "specialist", "description": "Explore and document codebase structure"},
        {"id": "researcher", "name": "Phase Researcher", "type": "specialist", "description": "Research unknown domains before planning"},
        {"id": "debugger", "name": "System Debugger", "type": "specialist", "description": "Investigate bugs systematically"}
    ]

    # Calculate agent status based on tasks
    type_to_agent = {
        TaskType.LITERATURE_SEARCH: "executor",
        TaskType.PDF_ACQUISITION: "executor",
        TaskType.REFERENCE_EXTRACTION: "executor",
        TaskType.SUMMARIZATION: "executor",
        TaskType.SYNTHESIS: "executor",
        TaskType.DRAFTING: "executor"
    }

    nodes = []
    # Hierarchical layout positions
    positions = {
        "orchestrator": {"x": 500, "y": 50},
        "executor": {"x": 300, "y": 200},
        "verifier": {"x": 700, "y": 200},
        "mapper": {"x": 200, "y": 400},
        "researcher": {"x": 400, "y": 400},
        "debugger": {"x": 600, "y": 400}
    }

    for agent in agents:
        # Determine agent status based on tasks
        agent_status = "idle"
        active_count = 0

        if agent["id"] == "executor":
            # Check if any executor tasks are running
            for task_type, state in task_states.items():
                if type_to_agent.get(task_type) == "executor":
                    if state == TaskState.RUNNING:
                        active_count += 1
                    elif state == TaskState.COMPLETED:
                        active_count += 1
            agent_status = "running" if any(s == TaskState.RUNNING for s in task_states.values()) else "idle"

        nodes.append({
            "id": agent["id"],
            "type": "agentNode",
            "position": positions.get(agent["id"], {"x": 0, "y": 0}),
            "data": {
                "label": agent["name"],
                "type": agent["type"],
                "status": agent_status,
                "description": agent["description"]
            }
        })

    # Define edges showing agent relationships
    edges = [
        # Orchestrator coordinates all agents
        {"id": "orchestrator-executor", "source": "orchestrator", "target": "executor", "label": "delegates"},
        {"id": "orchestrator-verifier", "source": "orchestrator", "target": "verifier", "label": "requests verification"},
        {"id": "orchestrator-mapper", "source": "orchestrator", "target": "mapper", "label": "spawns", "style": {"strokeDasharray": "5,5"}},
        {"id": "orchestrator-researcher", "source": "orchestrator", "target": "researcher", "label": "spawns", "style": {"strokeDasharray": "5,5"}},
        {"id": "orchestrator-debugger", "source": "orchestrator", "target": "debugger", "label": "spawns", "style": {"strokeDasharray": "5,5"}},

        # Verifier checks executor work
        {"id": "executor-verifier", "source": "executor", "target": "verifier", "label": "reports to"},

        # Specialists report findings back
        {"id": "mapper-orchestrator", "source": "mapper", "target": "orchestrator", "label": "reports", "style": {"strokeDasharray": "5,5"}},
        {"id": "researcher-orchestrator", "source": "researcher", "target": "orchestrator", "label": "reports", "style": {"strokeDasharray": "5,5"}},
        {"id": "debugger-orchestrator", "source": "debugger", "target": "orchestrator", "label": "reports", "style": {"strokeDasharray": "5,5"}}
    ]

    return {"nodes": nodes, "edges": edges}


@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=task.id,
        project_id=task.project_id,
        name=task.name,
        description=task.description,
        task_type=task.task_type.value,
        state=task.state.value,
        phase_index=task.phase_index,
        sequence_index=task.sequence_index,
        retry_count=task.retry_count,
        max_retries=task.max_retries,
        error_message=task.error_message,
        created_at=task.created_at,
        updated_at=task.updated_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
        output_artifact_id=task.output_artifact_id
    )


@api_router.post("/tasks/{task_id}/retry")
async def retry_task(task_id: str, db: AsyncSession = Depends(get_db)):
    """Retry a failed task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.state != TaskState.FAILED:
        raise HTTPException(status_code=400, detail="Only failed tasks can be retried")
    
    # Reset task to ready state
    await orchestration_engine.transition_task_state(db, task_id, TaskState.READY)
    await db.commit()
    
    # Enqueue for execution
    await task_worker.enqueue_task(task_id, task.project_id)
    
    return {"message": "Task retry scheduled", "task_id": task_id}


# ============== Artifact Endpoints ==============

@api_router.get("/projects/{project_id}/artifacts", response_model=List[ArtifactResponse])
async def list_project_artifacts(project_id: str, db: AsyncSession = Depends(get_db)):
    """List all artifacts for a project."""
    result = await db.execute(
        select(Artifact)
        .where(Artifact.project_id == project_id)
        .order_by(Artifact.created_at.desc())
    )
    artifacts = result.scalars().all()
    
    return [
        ArtifactResponse(
            id=a.id,
            project_id=a.project_id,
            task_id=a.task_id,
            run_id=a.run_id,
            artifact_type=a.artifact_type.value,
            title=a.title,
            content=a.content,
            metadata=a.artifact_metadata or {},
            version=a.version,
            created_at=a.created_at
        )
        for a in artifacts
    ]


@api_router.get("/artifacts/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific artifact."""
    result = await db.execute(
        select(Artifact).where(Artifact.id == artifact_id)
    )
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    return ArtifactResponse(
        id=artifact.id,
        project_id=artifact.project_id,
        task_id=artifact.task_id,
        run_id=artifact.run_id,
        artifact_type=artifact.artifact_type.value,
        title=artifact.title,
        content=artifact.content,
        metadata=artifact.artifact_metadata or {},
        version=artifact.version,
        created_at=artifact.created_at
    )


@api_router.put("/artifacts/{artifact_id}/content")
async def update_artifact_content(artifact_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update artifact content (creates new version)."""
    result = await db.execute(
        select(Artifact).where(Artifact.id == artifact_id)
    )
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    # Create new version
    new_artifact = Artifact(
        project_id=artifact.project_id,
        task_id=artifact.task_id,
        run_id=artifact.run_id,
        artifact_type=artifact.artifact_type,
        title=artifact.title,
        content=data.get("content", ""),
        metadata=artifact.artifact_metadata,
        version=artifact.version + 1,
        parent_artifact_id=artifact.id
    )
    db.add(new_artifact)
    await db.commit()
    
    return {"message": "Content updated", "artifact_id": new_artifact.id, "version": new_artifact.version}


@api_router.post("/artifacts/{artifact_id}/export")
async def export_artifact(artifact_id: str, request: ExportRequest, db: AsyncSession = Depends(get_db)):
    """Export an artifact to specified format."""
    result = await db.execute(
        select(Artifact).where(Artifact.id == artifact_id)
    )
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    file_bytes = export_service.export_document(
        content=artifact.content or "",
        title=request.title or artifact.title,
        format=request.format,
        author=request.author
    )
    
    if not file_bytes:
        raise HTTPException(status_code=500, detail="Export failed")
    
    from fastapi.responses import Response
    
    content_types = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "markdown": "text/markdown",
        "html": "text/html"
    }
    
    extensions = {"pdf": "pdf", "docx": "docx", "markdown": "md", "html": "html"}
    
    return Response(
        content=file_bytes,
        media_type=content_types.get(request.format, "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{artifact.title}.{extensions.get(request.format, "txt")}"'}
    )


# ============== Papers Endpoints ==============

@api_router.get("/projects/{project_id}/papers", response_model=List[PaperResponse])
async def list_project_papers(project_id: str, db: AsyncSession = Depends(get_db)):
    """List all papers for a project."""
    result = await db.execute(
        select(Paper).where(Paper.project_id == project_id)
    )
    papers = result.scalars().all()
    
    return [
        PaperResponse(
            id=p.id,
            project_id=p.project_id,
            source=p.source,
            title=p.title,
            authors=p.authors or [],
            abstract=p.abstract,
            year=p.year,
            citation_count=p.citation_count,
            url=p.url,
            pdf_url=p.pdf_url,
            summary=p.summary,
            created_at=p.created_at
        )
        for p in papers
    ]


@api_router.get("/papers/{paper_id}")
async def get_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific paper with full text."""
    result = await db.execute(
        select(Paper).where(Paper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    return {
        "id": paper.id,
        "project_id": paper.project_id,
        "source": paper.source,
        "title": paper.title,
        "authors": paper.authors or [],
        "abstract": paper.abstract,
        "year": paper.year,
        "citation_count": paper.citation_count,
        "url": paper.url,
        "pdf_url": paper.pdf_url,
        "summary": paper.summary,
        "full_text": paper.full_text,
        "page_count": paper.page_count,
        "relevance_score": paper.relevance_score,
        "created_at": paper.created_at.isoformat() if paper.created_at else None
    }


@api_router.get("/projects/{project_id}/citation-network")
async def get_citation_network(project_id: str, db: AsyncSession = Depends(get_db)):
    """Get citation network graph for visualization."""
    # Get all papers for the project
    result = await db.execute(
        select(Paper).where(Paper.project_id == project_id)
    )
    papers = list(result.scalars().all())
    
    # Build nodes
    nodes = []
    paper_ids = set()
    
    for paper in papers:
        paper_ids.add(paper.external_id)
        nodes.append({
            "id": paper.id,
            "type": "citationNode",
            "position": {"x": 0, "y": 0},  # Will be calculated by frontend
            "data": {
                "label": paper.title[:50] + "..." if len(paper.title) > 50 else paper.title,
                "title": paper.title,
                "authors": paper.authors[:3] if paper.authors else [],
                "year": paper.year,
                "citations": paper.citation_count or 0,
                "source": paper.source,
                "isPrimary": True,
                "hasFullText": bool(paper.full_text),
                "hasSummary": bool(paper.summary)
            }
        })
    
    # Get references to build edges
    ref_result = await db.execute(
        select(Reference).where(Reference.project_id == project_id)
    )
    references = list(ref_result.scalars().all())
    
    # Build paper_id to node_id mapping
    paper_to_node = {p.external_id: p.id for p in papers}
    
    # Build edges from references
    edges = []
    edge_id = 0
    
    for ref in references:
        # Find source paper
        source_paper = next((p for p in papers if p.id == ref.paper_id), None)
        if source_paper:
            edges.append({
                "id": f"ref-{edge_id}",
                "source": source_paper.id,
                "target": f"ref-{ref.id}",  # Reference node
                "type": "citation",
                "animated": False,
                "style": {"stroke": "#94a3b8", "strokeWidth": 1}
            })
            
            # Add reference as a secondary node if not already a primary paper
            nodes.append({
                "id": f"ref-{ref.id}",
                "type": "citationNode",
                "position": {"x": 0, "y": 0},
                "data": {
                    "label": ref.title[:40] + "..." if ref.title and len(ref.title) > 40 else (ref.title or "Unknown"),
                    "title": ref.title or ref.raw_text[:100],
                    "authors": ref.authors[:3] if ref.authors else [],
                    "year": ref.year,
                    "citations": 0,
                    "source": "reference",
                    "isPrimary": False,
                    "doi": ref.doi,
                    "arxiv_id": ref.arxiv_id
                }
            })
            edge_id += 1
    
    # Calculate layout positions (simple force-directed-like)
    import math
    primary_papers = [n for n in nodes if n["data"].get("isPrimary")]
    secondary_refs = [n for n in nodes if not n["data"].get("isPrimary")]
    
    # Layout primary papers in a circle
    for i, node in enumerate(primary_papers):
        angle = (2 * math.pi * i) / max(len(primary_papers), 1)
        node["position"] = {
            "x": 400 + 200 * math.cos(angle),
            "y": 300 + 200 * math.sin(angle)
        }
    
    # Layout secondary references in outer ring
    for i, node in enumerate(secondary_refs[:50]):  # Limit to 50 references
        angle = (2 * math.pi * i) / max(len(secondary_refs[:50]), 1)
        node["position"] = {
            "x": 400 + 400 * math.cos(angle),
            "y": 300 + 400 * math.sin(angle)
        }
    
    return {
        "nodes": nodes[:100],  # Limit total nodes
        "edges": edges[:200],  # Limit edges
        "stats": {
            "primary_papers": len(primary_papers),
            "references": len(secondary_refs),
            "total_citations": sum(p.citation_count or 0 for p in papers)
        }
    }


# ============== AI Action Endpoints ==============

@api_router.post("/ai/action")
async def perform_ai_action(request: AIActionRequest):
    """Perform an AI action on content."""
    prompts = {
        "rewrite": "Rewrite the following text to improve clarity:\n\n",
        "expand": "Expand on the following text with more detail:\n\n",
        "summarize": "Summarize the following text concisely:\n\n",
        "cite": "Add academic citations to support the claims:\n\n"
    }
    
    if request.action not in prompts:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")
    
    prompt = prompts[request.action] + request.content
    
    try:
        result = await llm_service.generate(prompt)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Stats Endpoints ==============

@api_router.get("/stats")
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    """Get global statistics."""
    project_count = await db.scalar(select(func.count(Project.id)))
    task_count = await db.scalar(select(func.count(Task.id)))
    artifact_count = await db.scalar(select(func.count(Artifact.id)))
    paper_count = await db.scalar(select(func.count(Paper.id)))
    
    # Task breakdown
    result = await db.execute(
        select(Task.state, func.count(Task.id)).group_by(Task.state)
    )
    task_breakdown = {row[0].value: row[1] for row in result.all()}
    
    return {
        "projects": project_count or 0,
        "tasks": task_count or 0,
        "artifacts": artifact_count or 0,
        "papers": paper_count or 0,
        "task_breakdown": task_breakdown
    }


# ============== Export Formats ==============

@api_router.get("/export/formats")
async def get_export_formats():
    """Get available export formats."""
    return {"formats": export_service.get_supported_formats()}


# Include routers in app
app.include_router(api_router)
app.include_router(file_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Run Server ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
