# Codebase Structure

**Analysis Date:** 2025-01-26

## Directory Layout

```
research/
├── backend/               # Python FastAPI backend service
├── frontend/              # Legacy React SPA (JavaScript)
├── frontend-v2/           # Modern React SPA (TypeScript rewrite)
├── .planning/             # GSD planning documents and phases
├── memory/                # Claude memory/context storage
├── tests/                 # Integration test files
└── [config files]         # docker-compose.yml, setup scripts, README
```

## Directory Purposes

**backend/:**
- Purpose: FastAPI REST/WebSocket server with PostgreSQL, Redis, async task execution
- Contains: Service layer, database models, orchestration engine, worker pool, realtime WebSocket handler
- Key files: `server.py` (FastAPI app), `models.py` (Pydantic models), `llm_service.py`, `literature_service.py`, `orchestration/engine.py`, `workers/task_worker.py`, `realtime/websocket.py`

**frontend/:**
- Purpose: Original React single-page application for research project management
- Contains: React components, pages, contexts, hooks, utilities
- Key files: `src/App.js` (view state routing), `src/index.js` (render root), `src/context/ProjectContext.js`, `src/components/` (layout, pages, graphs, artifacts, tasks, chat, dialogs, editor, viewer, ui)

**frontend-v2/:**
- Purpose: TypeScript rewrite with improved architecture, routing, and state management
- Contains: React components (TypeScript), Zustand stores, typed API service layer, pages
- Key files: `src/App.tsx` (BrowserRouter), `src/index.tsx` (render root), `src/pages/` (HomeDashboard, ConversationalPlanning), `src/stores/` (useProjectStore, useAuthStore, useCreditStore, useUIStore), `src/services/` (api.ts, projects.ts, planning.ts)

**.planning/:**
- Purpose: GSD (Generative Software Development) planning and phase documents
- Contains: `phases/` (implementation plans), `codebase/` (architecture docs, this file)
- Generated: Yes (by GSD commands)

**memory/:**
- Purpose: Claude AI memory/context persistence
- Contains: Conversation history, project context
- Generated: Yes

**tests/:**
- Purpose: Integration test files
- Contains: `test_servers.sh`, backend integration tests
- Generated: No

## Key File Locations

**Entry Points:**
- `/home/zemul/Programming/research/backend/server.py`: FastAPI server startup, route registration, startup/shutdown events
- `/home/zemul/Programming/research/frontend/src/index.js`: Legacy frontend render root
- `/home/zemul/Programming/research/frontend/src/App.js`: Legacy app with view state routing (dashboard/planning/workspace)
- `/home/zemul/Programming/research/frontend-v2/src/index.tsx`: Modern frontend render root
- `/home/zemul/Programming/research/frontend-v2/src/App.tsx`: Modern app with React Router

**Configuration:**
- `/home/zemul/Programming/research/backend/.env`: Backend environment variables (API keys, database URLs, CORS origins)
- `/home/zemul/Programming/research/backend/.env.template`: Environment variable template
- `/home/zemul/Programming/research/backend/requirements.txt`: Python dependencies
- `/home/zemul/Programming/research/frontend/package.json`: Legacy frontend npm dependencies
- `/home/zemul/Programming/research/frontend-v2/package.json`: Modern frontend npm dependencies
- `/home/zemul/Programming/research/docker-compose.yml`: Docker services (PostgreSQL, Redis)

**Core Logic:**
- `/home/zemul/Programming/research/backend/orchestration/engine.py`: Task orchestration engine (state transitions, dependency resolution)
- `/home/zemul/Programming/research/backend/workers/task_worker.py`: Async task execution loop with type dispatch
- `/home/zemul/Programming/research/backend/llm_service.py`: LLM text generation with provider fallback (OpenAI/Gemini/Mistral/Groq)
- `/home/zemul/Programming/research/backend/literature_service.py`: Academic literature search (Semantic Scholar, arXiv APIs)
- `/home/zemul/Programming/research/backend/pdf_service.py`: PDF download and text extraction
- `/home/zemul/Programming/research/backend/reference_service.py`: Citation extraction and formatting
- `/home/zemul/Programming/research/backend/planning_service.py`: Research plan generation from LLM
- `/home/zemul/Programming/research/backend/auth_service.py`: JWT authentication and user management
- `/home/zemul/Programming/research/backend/credit_service.py`: Credit billing and transaction tracking

**Database:**
- `/home/zemul/Programming/research/backend/database/models.py`: SQLAlchemy ORM models (Project, Plan, Task, TaskDependency, TaskRun, Artifact, Paper, Reference, ExecutionLog)
- `/home/zemul/Programming/research/backend/database/connection.py`: Async database session management
- `/home/zemul/Programming/research/backend/database/credit_models.py`: Credit and billing models (User, CreditTransaction, CreditPackage)

**Realtime:**
- `/home/zemul/Programming/research/backend/realtime/websocket.py`: WebSocket connection manager with Redis pub/sub

**Frontend Components (Legacy):**
- `/home/zemul/Programming/research/frontend/src/components/pages/`: Dashboard, PlanningFlow pages
- `/home/zemul/Programming/research/frontend/src/components/layout/`: StatusBar, Navigator, Workspace, Inspector panels
- `/home/zemul/Programming/research/frontend/src/components/graphs/`: Task graph, agent graph, citation network visualizations (ReactFlow)
- `/home/zemul/Programming/research/frontend/src/components/artifacts/`: Artifact cards, viewers, editors
- `/home/zemul/Programming/research/frontend/src/components/tasks/`: Task lists, status indicators
- `/home/zemul/Programming/research/frontend/src/components/chat/`: Chat interface for AI interactions
- `/home/zemul/Programming/research/frontend/src/components/editor/`: TipTap rich text editor
- `/home/zemul/Programming/research/frontend/src/components/ui/`: Reusable UI components (buttons, inputs, dialogs)

**Frontend Components (v2):**
- `/home/zemul/Programming/research/frontend-v2/src/pages/`: HomeDashboard, ConversationalPlanning
- `/home/zemul/Programming/research/frontend-v2/src/components/layout/`: WorkspaceLayout (app shell with header)
- `/home/zemul/Programming/research/frontend-v2/src/components/common/`: Shared components (Button, CreditsDisplay)
- `/home/zemul/Programming/research/frontend-v2/src/components/graphs/`: Task graph visualization (ReactFlow)
- `/home/zemul/Programming/research/frontend-v2/src/components/artifacts/`: Artifact cards, content viewers
- `/home/zemul/Programming/research/frontend-v2/src/components/tasks/`: Task status, task lists
- `/home/zemul/Programming/research/frontend-v2/src/components/chat/`: Chat interface
- `/home/zemul/Programming/research/frontend-v2/src/components/editor/`: TipTap editor
- `/home/zemul/Programming/research/frontend-v2/src/components/ui/`: UI primitives

**Frontend State (Legacy):**
- `/home/zemul/Programming/research/frontend/src/context/ProjectContext.js`: React Context for project/task/artifact selection
- `/home/zemul/Programming/research/frontend/src/context/ThemeContext.js`: Theme provider (light/dark mode)

**Frontend State (v2):**
- `/home/zemul/Programming/research/frontend-v2/src/stores/useProjectStore.ts`: Zustand store for active project, task graph, task statuses
- `/home/zemul/Programming/research/frontend-v2/src/stores/useAuthStore.ts`: Zustand store for user authentication state
- `/home/zemul/Programming/research/frontend-v2/src/stores/useCreditStore.ts`: Zustand store for credit balance
- `/home/zemul/Programming/research/frontend-v2/src/stores/useUIStore.ts`: Zustand store for UI state (modals, sidebars)

**Frontend Services (v2):**
- `/home/zemul/Programming/research/frontend-v2/src/services/api.ts`: Base API client (fetch wrappers with auth headers, error handling)
- `/home/zemul/Programming/research/frontend-v2/src/services/projects.ts`: Project API calls (getProjects, getProject, createProject, executeProject)
- `/home/zemul/Programming/research/frontend-v2/src/services/planning.ts`: Planning API calls (generatePlan, approvePlan)

**Frontend Types (v2):**
- `/home/zemul/Programming/research/frontend-v2/src/types/project.ts`: Project, ProjectStatus, OutputType, TaskCounts
- `/home/zemul/Programming/research/frontend-v2/src/types/task.ts`: Task, TaskState, TaskType, TaskGraphNode, TaskGraphEdge
- `/home/zemul/Programming/research/frontend-v2/src/types/artifact.ts`: Artifact, ArtifactType
- `/home/zemul/Programming/research/frontend-v2/src/types/api.ts`: API response/error types

**Testing:**
- `/home/zemul/Programming/research/backend/tests/test_api.py`: Backend API integration tests (pytest)
- `/home/zemul/Programming/research/frontend-v2/src/setupTests.ts`: Frontend test setup (React Testing Library)

**Scripts:**
- `/home/zemul/Programming/research/setup.sh`: Initial project setup (deps, DB, venv)
- `/home/zemul/Programming/research/run-all.sh`: Start all services (backend + frontend)
- `/home/zemul/Programming/research/run-backend.sh`: Start backend server only
- `/home/zemul/Programming/research/run-frontend.sh`: Start frontend only
- `/home/zemul/Programming/research/backend/scripts/migrate_add_credits.py`: Database migration for credit system
- `/home/zemul/Programming/research/backend/scripts/add_dependencies_to_existing_project.py`: Migration for task dependencies

## Naming Conventions

**Files:**
- Backend Python: `snake_case.py` (e.g., `llm_service.py`, `task_worker.py`)
- Frontend JavaScript: `PascalCase.js` for components, `camelCase.js` for utilities (e.g., `StatusBar.js`, `api.js`)
- Frontend TypeScript: `PascalCase.tsx` for components, `camelCase.ts` for utilities/services (e.g., `HomeDashboard.tsx`, `api.ts`)
- Test files: `*_test.py` (backend), `*.test.tsx` or `*.test.ts` (frontend)

**Directories:**
- Backend: `snake_case` (e.g., `orchestration/`, `realtime/`)
- Frontend: `camelCase` (e.g., `components/`, `pages/`, `services/`, `stores/`)

**Functions:**
- Backend Python: `snake_case` (e.g., `get_ready_tasks()`, `transition_task_state()`)
- Frontend JavaScript/TypeScript: `camelCase` (e.g., `getProjects()`, `setActiveProject()`, `handleSubmit()`)

**Variables:**
- Backend Python: `snake_case` (e.g., `project_id`, `task_counts`)
- Frontend JavaScript/TypeScript: `camelCase` (e.g., `researchGoal`, `isLoadingProjects`)

**Types/Classes:**
- Backend Python: `PascalCase` (e.g., `Project`, `TaskState`, `LLMService`)
- Frontend TypeScript: `PascalCase` (e.g., `Project`, `TaskGraphNode`, `ApiResponse`)

**Constants:**
- Backend Python: `UPPER_SNAKE_CASE` (e.g., `REDIS_URL`, `PROVIDER_ORDER`)
- Frontend: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)

## Where to Add New Code

**New Backend Service:**
- Implementation: `/home/zemul/Programming/research/backend/<service_name>_service.py`
- Tests: `/home/zemul/Programming/research/backend/tests/test_<service_name>.py`
- Import in: `server.py` if exposing endpoints

**New Backend Endpoint:**
- Implementation: Add route function in `/home/zemul/Programming/research/backend/server.py` under appropriate section (e.g., `# ============== Project Endpoints ==============`)
- Pydantic models: Add request/response models at top of `server.py` or in `/home/zemul/Programming/research/backend/models.py`

**New Frontend (v2) Page:**
- Implementation: `/home/zemul/Programming/research/frontend-v2/src/pages/<PageName>.tsx`
- Add route: In `/home/zemul/Programming/research/frontend-v2/src/App.tsx` add `<Route path="/path" element={<PageName />} />`

**New Frontend (v2) Component:**
- Shared/common: `/home/zemul/Programming/research/frontend-v2/src/components/common/<ComponentName>.tsx`
- Feature-specific: `/home/zemul/Programming/research/frontend-v2/src/components/<feature>/<ComponentName>.tsx`
- UI primitives: `/home/zemul/Programming/research/frontend-v2/src/components/ui/<ComponentName>.tsx`

**New Frontend (v2) Store:**
- Implementation: `/home/zemul/Programming/research/frontend-v2/src/stores/use<StoreName>Store.ts`
- Export from: `/home/zemul/Programming/research/frontend-v2/src/stores/index.ts`

**New Frontend (v2) Service:**
- Implementation: `/home/zemul/Programming/research/frontend-v2/src/services/<service>.ts`
- Use base API client: Import `{ api }` from `./api` for typed HTTP methods

**New Frontend (v2) Type:**
- Implementation: `/home/zemul/Programming/research/frontend-v2/src/types/<domain>.ts`
- Export types used across the app

**New Task Type:**
- Backend: Add enum value to `/home/zemul/Programming/research/backend/database/models.py:TaskType`
- Backend: Add handler in `/home/zemul/Programming/research/backend/workers/task_worker.py` (dispatch in execute_task method)
- Frontend: Add to `/home/zemul/Programming/research/frontend-v2/src/types/task.ts:TaskType` enum
- Frontend: Update agent graph in `/home/zemul/Programming/research/backend/server.py:get_agent_graph()`

**New Artifact Type:**
- Backend: Add enum value to `/home/zemul/Programming/research/backend/database/models.py:ArtifactType`
- Frontend: Add to `/home/zemul/Programming/research/frontend-v2/src/types/artifact.ts:ArtifactType` enum
- Frontend: Create viewer component in `/home/zemul/Programming/research/frontend-v2/src/components/artifacts/<ArtifactType>Viewer.tsx`

**Utilities:**
- Backend: `/home/zemul/Programming/research/backend/utils.py` (create if not exists)
- Frontend: `/home/zemul/Programming/research/frontend-v2/src/utils/<utility>.ts`

## Special Directories

**backend/venv/:**
- Purpose: Python virtual environment
- Generated: Yes
- Committed: No

**frontend/node_modules/, frontend-v2/node_modules/:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

**backend/__pycache__/, frontend-v2/src/__pycache__/:**
- Purpose: Python bytecode cache
- Generated: Yes
- Committed: No

**frontend/build/, frontend-v2/build/:**
- Purpose: Production build output
- Generated: Yes
- Committed: No

**.planning/:**
- Purpose: GSD planning documents
- Generated: Yes
- Committed: Yes

**memory/:**
- Purpose: Claude AI memory/context
- Generated: Yes
- Committed: Yes (depends on workflow)

---

*Structure analysis: 2025-01-26*
