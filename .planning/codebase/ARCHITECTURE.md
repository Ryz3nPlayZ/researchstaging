# Architecture

**Analysis Date:** 2025-01-31

## Pattern Overview

**Overall:** Three-tier state-driven orchestration architecture with separate frontend interfaces

**Key Characteristics:**
- State-driven orchestration: All workflow execution is governed by persisted database state, not in-memory logic
- Separation of concerns: Orchestration layer, execution layer, and realtime layer are independent
- Multi-frontend design: React web UI and Textual TUI both consume the same backend API
- Async-first: Python services use asyncio, React frontend uses async/await patterns
- Queue-based execution: Redis queue decouples task scheduling from execution

## Layers

**API Layer (FastAPI):**
- Purpose: HTTP/WebSocket interface for all clients
- Location: `/home/zemul/Programming/research/backend/server.py`
- Contains: REST endpoints, WebSocket handlers, request/response models
- Depends on: Database layer, orchestration engine, services, workers
- Used by: React frontend, TUI client

**Orchestration Layer:**
- Purpose: State management and workflow coordination
- Location: `/home/zemul/Programming/research/backend/orchestration/engine.py`
- Contains: `OrchestrationEngine` class that manages task state transitions, dependency resolution, and task scheduling
- Depends on: Database models (Task, TaskDependency, Plan)
- Used by: API layer, worker layer
- Key principle: Does not execute tasks directly - only manages state and scheduling decisions

**Worker/Execution Layer:**
- Purpose: Task execution and artifact generation
- Location: `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Contains: `TaskWorker` class that executes tasks via agents/tools
- Depends on: Database, service layer (LLM, literature, PDF, reference services), Redis queue
- Used by: Background task loop started at server startup

**Service Layer:**
- Purpose: Business logic and external integrations
- Location: `/home/zemul/Programming/research/backend/*_service.py`
- Contains: `LLMService`, `LiteratureService`, `PDFService`, `ReferenceService`, `ExportService`, `AuthService`, `CreditService`
- Depends on: External APIs (OpenAI, Google Scholar, arXiv, Semantic Scholar), database
- Used by: Worker layer, API layer

**Realtime Layer:**
- Purpose: Live updates to connected clients
- Location: `/home/zemul/Programming/research/backend/realtime/websocket.py`
- Contains: `ConnectionManager` for WebSocket management and Redis pub/sub
- Depends on: Redis, FastAPI WebSockets
- Used by: API layer

**Database Layer:**
- Purpose: Persistent state storage
- Location: `/home/zemul/Programming/research/backend/database/`
- Contains: SQLAlchemy models, connection management, migrations
- Depends on: PostgreSQL
- Used by: All layers

**Frontend Layer (React):**
- Purpose: Web-based user interface
- Location: `/home/zemul/Programming/research/frontend/src/`
- Contains: React components, API client, context providers
- Depends on: Backend API
- Used by: End users via browser

**Frontend Layer (TUI):**
- Purpose: Terminal-based user interface
- Location: `/home/zemul/Programming/research/research_tui/`
- Contains: Textual app screens, API client
- Depends on: Backend API
- Used by: End users via terminal

## Data Flow

**Project Creation Flow:**

1. User submits research goal via frontend (React or TUI)
2. `POST /api/projects` (or `/api/planning/approve` for guided flow) receives request
3. API layer creates `Project` and `Plan` records in database
4. API calls `orchestration_engine.expand_plan_to_tasks()` to convert plan into Task DAG
5. Orchestration engine creates Task records and TaskDependency relationships
6. Project status set to `PLANNED`
7. Response returned to frontend with project_id

**Project Execution Flow:**

1. User triggers execution via frontend
2. `POST /api/projects/{project_id}/execute` receives request
3. API updates project status to `EXECUTING`
4. API calls `orchestration_engine.get_ready_tasks()` to find tasks with no pending dependencies
5. API enqueues ready tasks via `task_worker.enqueue_task()` (pushes to Redis queue)
6. Background worker loop (`task_worker.run_worker_loop()`) dequeues tasks
7. Worker executes task by calling appropriate service (LLM, literature, PDF, etc.)
8. Worker creates `Artifact` record with output
9. Worker atomically updates Task state to `COMPLETED` or `FAILED`
10. State transition triggers orchestration engine to check dependent tasks
11. If dependencies satisfied, dependent task transitions to `READY` and is enqueued
12. WebSocket pushes real-time updates to connected clients

**Task State Machine:**

```
PENDING -> READY -> RUNNING -> COMPLETED
                    \-> FAILED -> READY (retry)
```

State transitions are persisted atomically in the database.

**Realtime Update Flow:**

1. Task state changes or artifact created
2. Worker publishes event to Redis pub/sub: `connection_manager.publish_event()`
3. WebSocket connection manager's Redis listener receives event
4. Manager broadcasts to all WebSocket connections for that project
5. Frontend receives WebSocket message and updates UI

**State Management:**

- Backend: All workflow state in PostgreSQL database. Tasks have explicit state field.
- Frontend (React): React Context (`ProjectContext`) for selected project, component-level state for UI
- TUI: `AppState` class in `/home/zemul/Programming/research/research_tui/state.py`
- Redis: Used for task queue and pub/sub messaging (not state persistence)

## Key Abstractions

**Project:**
- Purpose: Top-level container for all research work
- Examples: `/home/zemul/Programming/research/backend/database/models.py:Project`
- Pattern: Aggregate root containing Plan, Tasks, Artifacts, Papers, References

**Plan:**
- Purpose: Immutable research plan with phases and task definitions
- Examples: `/home/zemul/Programming/research/backend/database/models.py:Plan`
- Pattern: Template expanded into executable Task DAG

**Task:**
- Purpose: Unit of work with dependencies and state
- Examples: `/home/zemul/Programming/research/backend/database/models.py:Task`
- Pattern: State machine with explicit transitions (PENDING -> READY -> RUNNING -> COMPLETED/FAILED)

**Artifact:**
- Purpose: Output produced by task execution
- Examples: `/home/zemul/Programming/research/backend/database/models.py:Artifact`
- Pattern: Versioned content with metadata, linked to Task and Project

**Orchestration Engine:**
- Purpose: Manages task lifecycle without executing them
- Examples: `/home/zemul/Programming/research/backend/orchestration/engine.py:OrchestrationEngine`
- Pattern: State machine manager - reads state, makes scheduling decisions, writes new state

**Task Worker:**
- Purpose: Executes tasks and produces artifacts
- Examples: `/home/zemul/Programming/research/backend/workers/task_worker.py:TaskWorker`
- Pattern: Stateless executor - retrieves tasks, executes code, persists results, exits

## Entry Points

**Backend API Server:**
- Location: `/home/zemul/Programming/research/backend/server.py`
- Triggers: Running `python server.py` or `uvicorn server:app`
- Responsibilities: Starts FastAPI app, initializes database, starts background worker loop, registers WebSocket route

**Frontend Web App:**
- Location: `/home/zemul/Programming/research/frontend/src/index.js`
- Triggers: User loads web application in browser
- Responsibilities: Renders React root, mounts App component

**TUI Application:**
- Location: `/home/zemul/Programming/research/research_tui/main.py`
- Triggers: Running `python research_tui/main.py`
- Responsibilities: Starts Textual app, composes tabbed interface

**Background Worker Loop:**
- Location: `/home/zemul/Programming/research/backend/workers/task_worker.py:TaskWorker.run_worker_loop()`
- Triggers: Started automatically during server startup
- Responsibilities: Continuously polls Redis queue for tasks and executes them

## Error Handling

**Strategy:** Multi-layer error handling with state persistence

**Patterns:**

1. **Task-level errors:**
   - Worker catches exceptions during task execution
   - Sets Task state to `FAILED` with error_message
   - Retries tasks up to `max_retries` before permanent failure
   - Dependent tasks remain blocked until dependency resolved

2. **API-level errors:**
   - FastAPI HTTPException for client errors (404, 400)
   - 500 errors logged and returned as JSON
   - Database errors trigger rollback

3. **WebSocket errors:**
   - Connection manager catches and logs WebSocket send failures
   - Dead connections cleaned up from active set
   - Redis listener errors logged but don't crash server

4. **Service-level errors:**
   - LLM service: Returns error message on API failure
   - Literature service: Handles rate limiting, returns empty results on timeout
   - PDF service: Returns None on download failure

## Cross-Cutting Concerns

**Logging:** Standard Python `logging` module configured in `server.py`. All services have `logger = logging.getLogger(__name__)`.

**Validation:** Pydantic models for request/response validation. SQLAlchemy models validate database schema.

**Authentication:** JWT-based auth via `AuthService` (`/home/zemul/Programming/research/backend/auth_service.py`). Google OAuth integration. Credit system for usage tracking.

**Database Transactions:** AsyncSession from SQLAlchemy. All database writes wrapped in transactions. Explicit rollback on error.

**Concurrency:** Asyncio for async Python operations. Redis queue for task distribution. WebSocket connections managed per-project.

**State Consistency:** All state transitions in database. Orchestration engine uses database locks/select-for-update where needed. Worker uses atomic state updates.

---

*Architecture analysis: 2025-01-31*
