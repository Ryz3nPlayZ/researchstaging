# Architecture

**Analysis Date:** 2025-01-23

## Pattern Overview

**Overall:** State-driven orchestration with task DAG execution

**Key Characteristics:**
- All workflow execution is governed by persisted database state, not in-memory logic
- Task execution follows a directed acyclic graph (DAG) with explicit dependency resolution
- Stateless workers pull tasks from a Redis queue for fault-tolerant execution
- Real-time updates pushed via WebSocket/Redis pub/sub
- Clear separation between orchestration (state management) and execution (task processing)

## Layers

**API Layer:**
- Purpose: HTTP interface for frontend and external consumers
- Location: `research/backend/server.py`
- Contains: FastAPI endpoints, Pydantic models, CORS middleware
- Depends on: Database session, orchestration engine, service layer
- Used by: Frontend React application via `research/frontend/src/lib/api.js`

**Orchestration Layer:**
- Purpose: Plan expansion, task state machine, dependency resolution, DAG validation
- Location: `research/backend/orchestration/engine.py`
- Contains: `OrchestrationEngine` class with methods for task lifecycle management
- Depends on: Database models (Project, Plan, Task, TaskDependency)
- Used by: API layer (for plan expansion), Worker layer (for state transitions)

**Worker Execution Layer:**
- Purpose: Stateless task execution with retry logic and artifact persistence
- Location: `research/backend/workers/task_worker.py`
- Contains: `TaskWorker` class with task-specific execution methods
- Depends on: Database session, orchestration engine, service layer (LLM, PDF, literature)
- Used by: Background worker loop started on server startup

**Service Layer:**
- Purpose: External integrations and domain-specific operations
- Location: `research/backend/` (individual service files)
- Contains:
  - `llm_service.py`: LLM text generation (OpenAI, Gemini)
  - `literature_service.py`: Academic paper search (Semantic Scholar, arXiv)
  - `pdf_service.py`: PDF download and text extraction
  - `reference_service.py`: Citation extraction from paper text
  - `export_service.py`: Document export (PDF, DOCX, Markdown)
  - `planning_service.py`: Research plan generation
- Depends on: External APIs (LLM providers, academic databases)
- Used by: Worker layer for task execution

**Realtime Layer:**
- Purpose: WebSocket connection management and event broadcasting
- Location: `research/backend/realtime/websocket.py`
- Contains: `ConnectionManager` class for Redis pub/sub and WebSocket multiplexing
- Depends on: Redis, FastAPI WebSocket
- Used by: API layer for project updates, worker layer for task completion events

**Database Layer:**
- Purpose: Persistent state storage with ORM abstraction
- Location: `research/backend/database/`
- Contains:
  - `models.py`: SQLAlchemy ORM models (Project, Plan, Task, TaskDependency, TaskRun, Artifact, Paper, Reference, ExecutionLog)
  - `connection.py`: Async database connection factory
  - `__init__.py`: Model exports and session management
- Depends on: PostgreSQL (production), configured via asyncpg
- Used by: All layers for state persistence

**Frontend Layer:**
- Purpose: React-based UI for project management and monitoring
- Location: `research/frontend/src/`
- Contains: Components, contexts, hooks, API client
- Depends on: API layer via REST/WebSocket
- Used by: End users in browser

## Data Flow

**Project Creation Flow:**

1. User submits research goal via frontend planning wizard
2. Frontend calls `POST /api/planning/generate-plan` with user answers
3. LLM service generates structured plan (phases, tasks, dependencies)
4. User approves plan via frontend
5. Frontend calls `POST /api/planning/approve` with plan data
6. API creates Project record, Plan record (immutable)
7. Orchestration engine expands Plan into Task DAG with TaskDependency edges
8. Tasks initialized as PENDING, then transitioned to READY if no dependencies
9. Frontend redirects to workspace view

**Task Execution Flow:**

1. User clicks "Execute" in frontend, calls `POST /api/projects/{id}/execute`
2. API fetches all READY tasks from orchestration engine
3. Tasks enqueued to Redis queue `research_pilot:task_queue`
4. Background worker loop dequeues task (blocking with timeout)
5. Worker creates TaskRun record, marks task as RUNNING
6. Worker executes task type-specific logic (e.g., literature search, PDF processing)
7. Worker creates Artifact record with output
8. Worker marks TaskRun as COMPLETED, transitions Task to COMPLETED
9. Orchestration engine updates dependent tasks to READY (if all deps satisfied)
10. Worker publishes event to Redis pub/sub `project:{project_id}`
11. ConnectionManager broadcasts event to all WebSocket clients for project
12. Frontend updates UI with new task state and artifact
13. Repeat until all tasks complete or fail

**State Management:**

- **Project Status**: Derived from aggregate task counts (COMPLETED count vs total)
- **Task State**: Finite state machine with atomic transitions (PENDING → READY → RUNNING → COMPLETED/FAILED)
- **Artifacts**: Immutable versioned outputs linked to TaskRun
- **Papers/References**: Scoped to project, used as task inputs
- **Execution Logs**: Immutable audit trail for debugging

## Key Abstractions

**Project:**
- Purpose: Top-level execution unit containing all research state
- Examples: `research/backend/database/models.py:89` (Project model)
- Pattern: Aggregate root with cascading deletes for all child records

**Plan:**
- Purpose: Immutable specification of intended workflow (phases and tasks)
- Examples: `research/backend/database/models.py:130` (Plan model)
- Pattern: Created once during planning phase, never modified, expanded into Tasks

**Task DAG:**
- Purpose: Executable directed acyclic graph derived from Plan
- Examples: `research/backend/orchestration/engine.py:38` (expand_plan_to_tasks)
- Pattern: Nodes=Tasks with phase/sequence ordering, Edges=TaskDependency records, validated for cycles

**Task State Machine:**
- Purpose: Controlled transitions with validation and side effects
- Examples: `research/backend/orchestration/engine.py:254` (transition_task_state)
- Pattern: Enum-based states with valid transition mapping, atomic updates with row locks

**TaskRun:**
- Purpose: Individual execution attempt (including retries)
- Examples: `research/backend/database/models.py:261` (TaskRun model)
- Pattern: One task can have multiple runs, each produces separate artifact, tracks tokens/duration

**Artifact:**
- Purpose: Versioned immutable output from task execution
- Examples: `research/backend/database/models.py:307` (Artifact model)
- Pattern: Linked to task_id and run_id, versioned via parent_artifact_id, content or metadata only

**Worker Queue:**
- Purpose: Decouple task scheduling from execution
- Examples: `research/backend/workers/task_worker.py:54` (enqueue_task)
- Pattern: Redis list as queue, BLPOP for blocking dequeue, JSON payload with task_id/project_id/timestamp

**Realtime Events:**
- Purpose: Push-based updates to connected clients
- Examples: `research/backend/realtime/websocket.py:104` (publish_event)
- Pattern: Redis pub/sub per project (`project:{project_id}`), WebSocket manager broadcasts to client set

## Entry Points

**Backend Server:**
- Location: `research/backend/server.py`
- Triggers: `python research/backend/server.py` or uvicorn startup
- Responsibilities:
  - FastAPI app initialization with CORS middleware
  - Database connection pool setup
  - WebSocket route registration
  - Task worker loop startup (background task)
  - API router inclusion with /api prefix

**Frontend Application:**
- Location: `research/frontend/src/index.js`
- Triggers: Browser loads `index.html`, React mounts App component
- Responsibilities:
  - Context providers (ThemeContext, ProjectProvider)
  - Root routing via viewState (dashboard/planning/workspace)
  - WebSocket connection setup per selected project

**Orchestration Engine:**
- Location: `research/backend/orchestration/engine.py`
- Triggers: Called by API endpoints (plan expansion, project execution)
- Responsibilities:
  - Plan-to-task DAG expansion with dependency resolution
  - Task state transitions with validation
  - Ready task queries for worker consumption
  - Project status derivation from task counts

**Task Worker Loop:**
- Location: `research/backend/workers/task_worker.py`
- Triggers: Server startup event creates background asyncio task
- Responsibilities:
  - Continuous Redis queue polling with BLPOP timeout
  - Task execution with run creation and artifact persistence
  - Error handling with retry counting
  - Event publishing for WebSocket broadcast

**Planning Service:**
- Location: `research/backend/planning_service.py`
- Triggers: User submits planning answers via frontend wizard
- Responsibilities:
  - LLM-based research plan generation
  - Structured JSON response with phases/tasks/search terms
  - Plan validation and formatting

## Error Handling

**Strategy:** Multi-layer error handling with retry logic and event logging

**Patterns:**

**Task-level errors:**
- Worker catches exceptions during task execution
- Creates TaskRun with error_message and error_details
- Calls `orchestration_engine.fail_task_run()` which:
  - If retry_count < max_retries: transitions Task to READY for retry
  - If retry_count >= max_retries: transitions Task to FAILED (terminal)
- Publishes `task_failed` event via Redis
- Logs to ExecutionLog table for audit

**API-level errors:**
- FastAPI HTTPException for 404 (project/task not found)
- Pydantic validation errors automatically return 400
- Database errors caught and logged, return 500

**WebSocket errors:**
- ConnectionManager removes dead connections from active set
- Client reconnects on disconnect with exponential backoff
- Ping/pong every 30 seconds to detect stale connections

**Service-level errors:**
- LLM service errors propagate to worker as exceptions
- PDF processing errors logged as warnings, continue with next paper
- Literature search API errors caught and logged, partial results accepted

**Database errors:**
- AsyncSession with explicit commit/rollback
- Row-level locks with `with_for_update()` for state transitions
- Connection pooling handles transient connection errors

## Cross-Cutting Concerns

**Logging:** Python standard logging with structured format (timestamp, logger, level, message)
- Database: ExecutionLog table for immutable audit trail
- Application: logger.info/warning/error throughout
- Frontend: console.log for WebSocket events, errors

**Validation:**
- Backend: Pydantic models for request/response validation
- Database: SQLAlchemy constraints (unique, not null, foreign keys, check constraints)
- Frontend: Zod schemas for form validation (react-hook-form)

**Authentication:** Not currently implemented (no auth middleware)

**Caching:** Redis used for queue and pub/sub only (no response caching)

**Time:** All timestamps in UTC via `datetime.now(timezone.utc)`

**IDs:** UUID v4 string format for all entities (Project, Task, Artifact, etc.)

**Configuration:** Environment variables via python-dotenv, loaded in `server.py`

---

*Architecture analysis: 2025-01-23*
