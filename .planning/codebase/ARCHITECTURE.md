# Architecture

**Analysis Date:** 2025-01-26

## Pattern Overview

**Overall:** Three-tier service-oriented architecture with state-driven orchestration

**Key Characteristics:**
- **State-driven orchestration**: All workflow execution governed by persisted database state, not in-memory logic
- **Event-driven real-time updates**: WebSocket + Redis pub/sub for live task/artifact updates
- **Service layer separation**: Distinct services for LLM, literature, PDF, references, export, credits, auth
- **Multi-frontend evolution**: Legacy React frontend (`frontend/`) + modern TypeScript rewrite (`frontend-v2/`)
- **Agent-based task execution**: Worker pool with specialized task handlers (literature search, PDF acquisition, summarization, synthesis, drafting)

## Layers

**Backend API Layer:**
- Purpose: FastAPI REST/WebSocket server exposing research execution endpoints
- Location: `/home/zemul/Programming/research/backend/server.py`
- Contains: Route handlers, Pydantic models, WebSocket endpoints, health checks
- Depends on: Database layer (SQLAlchemy), Orchestration engine, Service layer, Worker pool
- Used by: Frontend applications via HTTP/WebSocket

**Orchestration Engine:**
- Purpose: State machine for task execution, dependency resolution, state transitions
- Location: `/home/zemul/Programming/research/backend/orchestration/engine.py`
- Contains: Task DAG construction, dependency graph traversal, state transition logic, ready-task scheduling
- Depends on: Database models (Task, TaskDependency), Task state enums
- Used by: Server endpoints (project execution, task retry), Worker pool

**Service Layer:**
- Purpose: Domain-specific business logic isolated into focused services
- Location: `/home/zemul/Programming/research/backend/*.py` (llm_service.py, literature_service.py, pdf_service.py, reference_service.py, export_service.py, auth_service.py, credit_service.py, planning_service.py)
- Contains: External API integrations (Semantic Scholar, arXiv, OpenAI/Gemini/Mistral), file processing, credit billing, LLM text generation
- Depends on: External APIs (httpx), Environment configuration, Database (for auth/credits)
- Used by: Task worker, Server endpoints (AI actions, planning)

**Worker Pool:**
- Purpose: Async task execution with queue-based scheduling
- Location: `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Contains: Task queue management, task type dispatch to handlers, retry logic, artifact creation
- Depends on: Database (Task state updates), Service layer (LLM, literature, PDF, etc.)
- Used by: Orchestration engine (enqueues ready tasks)

**Database Layer:**
- Purpose: Persistent state for projects, plans, tasks, artifacts, papers, users, credits
- Location: `/home/zemul/Programming/research/backend/database/` (models.py, connection.py, credit_models.py)
- Contains: SQLAlchemy ORM models, async session management, UUID generation, JSONB fields
- Depends on: PostgreSQL (via asyncpg)
- Used by: All backend layers

**Realtime Layer:**
- Purpose: WebSocket connection management and Redis pub/sub for live updates
- Location: `/home/zemul/Programming/research/backend/realtime/websocket.py`
- Contains: Connection multiplexing, Redis channel subscriptions, message broadcasting
- Depends on: Redis, FastAPI WebSocket
- Used by: Server (WebSocket endpoint), Worker (publishes task/artifact events)

**Frontend Layer (Legacy):**
- Purpose: Original React SPA with dashboard, planning flow, workspace visualization
- Location: `/home/zemul/Programming/research/frontend/src/`
- Contains: Pages, components, React Context for state management
- Depends on: Backend API (axios), React Router, TipTap editor, ReactFlow
- Used by: End users

**Frontend Layer (v2 - Modern):**
- Purpose: TypeScript rewrite with improved architecture, routing, and state management
- Location: `/home/zemul/Programming/research/frontend-v2/src/`
- Contains: Pages (HomeDashboard, ConversationalPlanning), Zustand stores, service layer (typed API clients)
- Depends on: Backend API (fetch wrappers), React Router v7, Zustand, React Query
- Used by: End users (future replacement for legacy frontend)

## Data Flow

**Project Creation Flow:**

1. User submits research goal via frontend (`HomeDashboard.tsx` or `PlanningFlow.js`)
2. Frontend calls `POST /api/planning/generate-plan` with research goal and answers
3. `llm_service.generate_research_plan()` creates structured plan (phases, search terms, key themes)
4. User approves plan via `POST /api/planning/approve`
5. Server creates `Project` and immutable `Plan` records in database
6. `orchestration_engine.expand_plan_to_tasks()` converts plan phases into `Task` records with dependencies
7. Returns project_id to frontend

**Project Execution Flow:**

1. User triggers execution via `POST /api/projects/{project_id}/execute`
2. Server updates `Project.status` to `EXECUTING`
3. `orchestration_engine.get_ready_tasks()` queries tasks with no pending dependencies (state = READY)
4. Each ready task enqueued in `task_worker` queue
5. Worker loop:
   - Polls queue for task
   - Transitions task state to RUNNING
   - Dispatches to handler based on `TaskType` (literature_search, pdf_acquisition, summarization, etc.)
   - Handler calls appropriate service (literature_service, pdf_service, llm_service)
   - On success: creates `Artifact` record, links to task, transitions task to COMPLETED
   - On failure: records error, transitions task to FAILED (if retry_count < max_retries, transitions back to READY)
6. Each task completion triggers dependency check: ready tasks enqueued
7. All task completions publish events to Redis (`project:{project_id}`)
8. WebSocket clients receive updates via `ConnectionManager` from Redis pub/sub
9. Frontend updates UI in real-time (task graphs, artifact lists, status badges)

**Task State Machine:**

```
PENDING → READY → RUNNING → COMPLETED
          ↑        ↓
          └── FAILED (with retry)
```

- State transitions persisted atomically in database
- Orchestration engine queries for READY tasks on each cycle
- Worker transitions RUNNING → COMPLETED or RUNNING → FAILED
- Failed tasks with remaining retries transition back to READY

**Real-time Update Flow:**

1. Task worker completes task (creates artifact, updates state)
2. Worker calls `connection_manager.publish_event(project_id, "task_completed", {task_id, artifact_id})`
3. ConnectionManager publishes to Redis channel `project:{project_id}`
4. WebSocket listener (`_redis_listener`) receives message
5. Forwards to all WebSocket connections for that project_id
6. Frontend WebSocket handler updates Zustand store or React state
7. Components re-render with new task/artifact data

## Key Abstractions

**Project:**
- Purpose: Top-level container for research work
- Examples: `/home/zemul/Programming/research/backend/database/models.py:89` (SQLAlchemy model), `/home/zemul/Programming/research/frontend-v2/src/types/project.ts`
- Pattern: Aggregate root containing Plan, Tasks, Artifacts, Papers, ExecutionLogs

**Plan:**
- Purpose: Immutable specification of intended workflow (phases, search terms, key themes)
- Examples: `/home/zemul/Programming/research/backend/database/models.py:130`
- Pattern: Generated once per project, expanded into executable Tasks, never modified

**Task:**
- Purpose: Executable unit of work with type, dependencies, state, retry count
- Examples: `/home/zemul/Programming/research/backend/database/models.py:236`
- Pattern: State machine with transitions (PENDING → READY → RUNNING → COMPLETED/FAILED), linked to parent Plan via phase_index/sequence_index

**Artifact:**
- Purpose: Output produced by task execution (search results, PDF content, summaries, drafts)
- Examples: `/home/zemul/Programming/research/backend/database/models.py:330`
- Pattern: Versioned content with metadata (paper IDs, reference counts), linked to Task and Project

**Agent:**
- Purpose: Logical abstraction for task type specialization (Router, Search, PDF, Reference, Summary, Synthesis, Drafting, Evaluator)
- Examples: `/home/zemul/Programming/research/backend/server.py:577-586`
- Pattern: Agent graph visualization in frontend, backed by TaskType enum and worker handlers

**Service:**
- Purpose: Isolated business logic for external integrations (LLM providers, academic APIs, file processing)
- Examples: `/home/zemul/Programming/research/backend/llm_service.py`, `/home/zemul/Programming/research/backend/literature_service.py`
- Pattern: Singleton instances with lazy client initialization, provider fallback logic (OpenAI → Gemini → Mistral → Groq)

**Store:**
- Purpose: Frontend state management with Zustand
- Examples: `/home/zemul/Programming/research/frontend-v2/src/stores/useProjectStore.ts`, `/home/zemul/Programming/research/frontend-v2/src/stores/useAuthStore.ts`, `/home/zemul/Programming/research/frontend-v2/src/stores/useCreditStore.ts`
- Pattern: Global state slices (auth, credits, project, UI) with actions and selectors

## Entry Points

**Backend Server:**
- Location: `/home/zemul/Programming/research/backend/server.py`
- Triggers: `python server.py` or uvicorn startup
- Responsibilities: FastAPI app initialization, route registration, startup/shutdown events (DB init, worker start, Redis connect)

**Frontend (Legacy) App:**
- Location: `/home/zemul/Programming/research/frontend/src/index.js` (render root), `/home/zemul/Programming/research/frontend/src/App.js` (routing)
- Triggers: Browser loads index.html, React mounts App
- Responsibilities: View state management (dashboard/planning/workspace), context providers (Theme, Project), component rendering

**Frontend (v2) App:**
- Location: `/home/zemul/Programming/research/frontend-v2/src/index.tsx` (render root), `/home/zemul/Programming/research/frontend-v2/src/App.tsx` (BrowserRouter setup)
- Triggers: Browser loads index.html, React mounts App
- Responsibilities: React Router configuration, route definitions (`/`, `/plan`, `/project/:id`)

**Task Worker Loop:**
- Location: `/home/zemul/Programming/research/backend/workers/task_worker.py:run_worker_loop()`
- Triggers: Server startup calls `asyncio.create_task(task_worker.run_worker_loop())`
- Responsibilities: Poll task queue, dispatch tasks to handlers by type, persist state transitions, publish events

**Orchestration Engine:**
- Location: `/home/zemul/Programming/research/backend/orchestration/engine.py`
- Triggers: Server endpoints call `expand_plan_to_tasks()`, `get_ready_tasks()`, `transition_task_state()`
- Responsibilities: Plan-to-task expansion, dependency graph queries, state machine transitions

## Error Handling

**Strategy:** Multi-layer error handling with retry logic and user feedback

**Patterns:**

**Backend Layer:**
- HTTP exceptions with status codes (404 for not found, 400 for bad input, 500 for server errors)
- Database transactions with rollback on exception (`try/except/rollback` pattern in `/home/zemul/Programming/research/backend/server.py`)
- Task retry with exponential backoff (`task.retry_count < task.max_retries` in worker)
- LLM provider fallback (OpenAI → Gemini → Mistral → Groq in `/home/zemul/Programming/research/backend/llm_service.py`)

**Frontend Layer (Legacy):**
- React Context error boundaries (not yet implemented)
- axios interceptors for 401 auth errors (not yet implemented)
- Sonner toast notifications for user feedback (`<Toaster />` in App.js)

**Frontend Layer (v2):**
- `ApiRequestError` custom error class in `/home/zemul/Programming/research/frontend-v2/src/services/api.ts`
- try/catch in service functions with error logging
- Future: React Query error callbacks for automatic retry and UI feedback

## Cross-Cutting Concerns

**Logging:** Python `logging` module in backend, configured at INFO level, structured logging with timestamps
**Validation:** Pydantic models for request/response validation in backend, TypeScript types in frontend-v2
**Authentication:** JWT-based auth service (`/home/zemul/Programming/research/backend/auth_service.py`), token stored in localStorage (`auth_token`), Bearer header in API requests
**CORS:** Configured via environment variable `CORS_ORIGINS` (default `*` for development)
**Credits:** Usage tracking and billing in `credit_service.py`, credit packages, transaction history, low-balance warnings

---

*Architecture analysis: 2025-01-26*
