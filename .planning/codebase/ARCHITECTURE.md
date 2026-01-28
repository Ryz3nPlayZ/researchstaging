# Architecture

**Analysis Date:** 2025-01-27

## Pattern Overview

**Overall:** State-Driven Microservices Architecture with Async Orchestration

**Key Characteristics:**
- All workflow execution is governed by persisted database state, not in-memory logic
- Asynchronous task execution via Redis queue with worker pools
- Real-time updates via WebSocket pub/sub through Redis
- DAG-based task dependencies with automatic resolution
- Immutable artifacts with versioning for reproducibility

## Layers

### Backend API Layer (`backend/server.py`)
- Purpose: HTTP/WS interface, request routing, response serialization
- Location: `/home/zemul/Programming/research/backend/server.py`
- Contains: FastAPI endpoints, WebSocket routes, CORS middleware
- Depends on: Database session, orchestration engine, service layer
- Used by: Frontend clients via HTTP/WS

### Orchestration Layer (`backend/orchestration/`)
- Purpose: Task DAG management, state transitions, dependency resolution
- Location: `/home/zemul/Programming/research/backend/orchestration/engine.py`
- Contains: `OrchestrationEngine` class that manages task lifecycle
- Depends on: Database models (Task, TaskDependency, Plan)
- Used by: API layer (project/task endpoints), worker layer

### Database Layer (`backend/database/`)
- Purpose: Persistence, state management, relational integrity
- Location: `/home/zemul/Programming/research/backend/database/models.py`, `connection.py`
- Contains: SQLAlchemy models, async session management, enums
- Depends on: PostgreSQL database
- Used by: All layers for state persistence

### Worker Execution Layer (`backend/workers/`)
- Purpose: Stateless task execution, agent invocation, artifact creation
- Location: `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Contains: `TaskWorker` class that executes tasks by type
- Depends on: Service layer (llm_service, literature_service, pdf_service), orchestration engine
- Used by: Redis queue (consumes tasks)

### Service Layer (`backend/*.py`)
- Purpose: Domain-specific business logic, external API integration
- Location: `/home/zemul/Programming/research/backend/llm_service.py`, `literature_service.py`, `pdf_service.py`, `reference_service.py`, `planning_service.py`
- Contains: Service classes for LLM calls, literature search, PDF processing, reference extraction
- Depends on: External APIs (OpenAI, Semantic Scholar, arXiv), database
- Used by: Worker layer for task execution

### Realtime Layer (`backend/realtime/`)
- Purpose: WebSocket connection management, event broadcasting
- Location: `/home/zemul/Programming/research/backend/realtime/websocket.py`
- Contains: `ConnectionManager` for WS + Redis pub/sub
- Depends on: Redis for pub/sub messaging
- Used by: API layer (WebSocket endpoint), worker layer (event publishing)

### Frontend State Layer (`frontend-v2/src/stores/`)
- Purpose: Client-side state management, reactive data
- Location: `/home/zemul/Programming/research/frontend-v2/src/stores/`
- Contains: Zustand stores (useProjectStore, useAuthStore, useCreditStore, useUIStore)
- Depends on: Type definitions
- Used by: React components

### Frontend Service Layer (`frontend-v2/src/services/`)
- Purpose: API communication, HTTP abstraction
- Location: `/home/zemul/Programming/research/frontend-v2/src/services/api.ts`, `planning.ts`, `projects.ts`
- Contains: Typed fetch wrappers, endpoint-specific clients
- Depends on: Backend API endpoints
- Used by: React components, state stores

### Frontend UI Layer (`frontend-v2/src/components/`, `pages/`)
- Purpose: User interface, visualizations, interaction
- Location: `/home/zemul/Programming/research/frontend-v2/src/components/`, `pages/`
- Contains: React components, page components
- Depends on: State stores, service layer, React Flow for visualizations
- Used by: End users via browser

## Data Flow

**Project Creation Flow:**

1. User submits research goal via `/home/zemul/Programming/research/frontend-v2/src/pages/ConversationalPlanning.tsx`
2. Frontend calls `POST /api/planning/generate-plan` via `/home/zemul/Programming/research/frontend-v2/src/services/planning.ts`
3. Backend `llm_service.generate_research_plan()` creates phased plan structure
4. User approves plan → `POST /api/planning/approve` creates Project and Plan records
5. `orchestration_engine.expand_plan_to_tasks()` generates Task DAG from Plan phases
6. TaskDependency records link tasks based on phase/sequence ordering
7. Tasks with no dependencies transition to READY state

**Task Execution Flow:**

1. User triggers execution via `POST /api/projects/{id}/execute`
2. Backend queries `orchestration_engine.get_ready_tasks()` for READY tasks
3. Each ready task is enqueued to Redis queue `research_pilot:task_queue`
4. `task_worker.run_worker_loop()` dequeues task JSON
5. Worker calls `execute_task(task_id)` which:
   - Creates TaskRun record
   - Transitions Task to RUNNING
   - Executes task-specific logic (search, PDF, summary, etc.)
   - Creates Artifact output
   - Completes TaskRun, transitions Task to COMPLETED
6. On completion, orchestration engine checks dependent tasks
7. Dependents with all satisfied dependencies transition to READY
8. Loop continues until all tasks complete or fail
9. Events published to Redis `project:{project_id}` channel
10. WebSocket clients receive real-time updates via `ConnectionManager`

**State Update Flow:**

1. Task state change → `orchestration_engine.transition_task_state()`
2. Database update within transaction
3. `_update_project_task_counts()` aggregates task states
4. `update_project_status()` derives project status from task counts
5. Event published to Redis pub/sub
6. WebSocket clients forward to connected browsers
7. Frontend stores (useProjectStore) update React components

**State Management:**
- Backend: All state in PostgreSQL, transitions are atomic database transactions
- Frontend: Zustand stores manage local state, synchronized via API calls + WebSocket events
- Redis: Task queue (FIFO) + pub/sub messaging (broadcast)

## Key Abstractions

**Project:**
- Purpose: Top-level execution container, scopes all work
- Examples: `/home/zemul/Programming/research/backend/database/models.py:89` (Project model)
- Pattern: Aggregate root with cascading relationships to Plan, Tasks, Artifacts, Papers

**Plan:**
- Purpose: Immutable workflow specification created by LLM planning
- Examples: `/home/zemul/Programming/research/backend/database/models.py:130`
- Pattern: JSONB phases array containing task definitions, not directly executable

**Task:**
- Purpose: Smallest executable unit, represents single agent/tool invocation
- Examples: `/home/zemul/Programming/research/backend/database/models.py:167`
- Pattern: State machine (PENDING → READY → RUNNING → COMPLETED/FAILED), retry-aware

**TaskDependency:**
- Purpose: Explicit DAG edges defining execution order constraints
- Examples: `/home/zemul/Programming/research/backend/database/models.py:234`
- Pattern: Many-to-many self-referential relationship on Task, validated for acyclicity

**Artifact:**
- Purpose: Immutable output with versioning, reproducible results
- Examples: `/home/zemul/Programming/research/backend/database/models.py:307`
- Pattern: Linked to Task + TaskRun, versioned with parent_artifact_id for edits

**TaskRun:**
- Purpose: Individual execution attempt including retries
- Examples: `/home/zemul/Programming/research/backend/database/models.py:261`
- Pattern: One-to-many with Task (run_number increments on retry), tracks duration/tokens

## Entry Points

**Backend Server:**
- Location: `/home/zemul/Programming/research/backend/server.py`
- Triggers: `python backend/server.py` or `uvicorn server:app`
- Responsibilities: FastAPI app initialization, router registration, startup/shutdown events, middleware

**Frontend Application:**
- Location: `/home/zemul/Programming/research/frontend-v2/src/index.tsx`
- Triggers: `npm start` (react-scripts start)
- Responsibilities: React DOM mounting, root component rendering

**Frontend Router:**
- Location: `/home/zemul/Programming/research/frontend-v2/src/App.tsx`
- Triggers: Browser URL changes
- Responsibilities: Route definitions (/, /chat, /project/:id, /graph views), component mapping

**Worker Process:**
- Location: `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Triggers: `asyncio.create_task(task_worker.run_worker_loop())` on server startup
- Responsibilities: Redis queue consumption, task execution delegation, event publishing

**WebSocket Endpoint:**
- Location: `/home/zemul/Programming/research/backend/realtime/websocket.py:134`
- Triggers: Client connects to `ws://localhost:8000/ws/{project_id}`
- Responsibilities: Connection management, Redis pub/sub subscription, message forwarding

## Error Handling

**Strategy:** Multi-level error handling with retry and recovery

**Patterns:**

1. **API Level:** FastAPI HTTPException with status codes
   - Location: `/home/zemul/Programming/research/backend/server.py`
   - Returns: JSON error responses with detail messages
   - Example: 404 for not found, 500 for server errors

2. **Orchestration Level:** State transitions with error tracking
   - Location: `/home/zemul/Programming/research/backend/orchestration/engine.py:326`
   - Pattern: `transition_task_state()` validates transitions, stores error_message on Task
   - Example: FAILED state can transition back to READY for retry

3. **Worker Level:** Retry with exponential backoff
   - Location: `/home/zemul/Programming/research/backend/workers/task_worker.py:467`
   - Pattern: `fail_task_run()` increments retry_count, max_retries enforced
   - Example: Tasks retry up to 3 times before permanent failure

4. **Frontend Level:** ApiRequestError with user feedback
   - Location: `/home/zemul/Programming/research/frontend-v2/src/services/api.ts:17`
   - Pattern: Custom Error class with status code and response data
   - Example: Toast notifications on API failures

## Cross-Cutting Concerns

**Logging:**
- Backend: Python stdlib logging to stdout, JSON-structured ExecutionLog records
- Pattern: `logger.info/warning/error()` throughout codebase
- Location: `/home/zemul/Programming/research/backend/database/models.py:419` (ExecutionLog model)

**Validation:**
- Backend: Pydantic models for request/response validation
- Pattern: All endpoints use Pydantic BaseModel schemas
- Location: `/home/zemul/Programming/research/backend/server.py:66` (ProjectCreate, PlanApproval, etc.)

**Authentication:**
- Backend: JWT tokens via python-jose, Bearer token authorization
- Pattern: HTTP Authorization header, token stored in localStorage
- Location: `/home/zemul/Programming/research/backend/auth_service.py`, `/home/zemul/Programming/research/frontend-v2/src/services/api.ts:52`

**Real-time Communication:**
- Pattern: WebSocket + Redis pub/sub for broadcast
- Connection per project, messages pushed to all clients for that project
- Location: `/home/zemul/Programming/research/backend/realtime/websocket.py:21` (ConnectionManager)

**CORS:**
- Pattern: CORS middleware allowing all origins in development
- Location: `/home/zemul/Programming/research/backend/server.py:1053`

---

*Architecture analysis: 2025-01-27*
