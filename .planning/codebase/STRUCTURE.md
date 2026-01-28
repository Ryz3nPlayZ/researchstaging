# Codebase Structure

**Analysis Date:** 2025-01-27

## Directory Layout

```
[project-root]/
├── backend/                 # Python FastAPI backend
│   ├── database/           # SQLAlchemy models, connection
│   ├── orchestration/     # Task DAG engine, state management
│   ├── realtime/          # WebSocket, Redis pub/sub
│   ├── workers/           # Task execution layer
│   └── *.py               # Service modules (llm, pdf, literature, etc.)
├── frontend-v2/           # React TypeScript frontend (v2)
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React UI components
│   │   ├── pages/         # Route-level page components
│   │   ├── services/      # API clients
│   │   ├── stores/        # Zustand state stores
│   │   ├── types/         # TypeScript type definitions
│   │   ├── hooks/         # Custom React hooks
│   │   ├── styles/        # Global CSS, Tailwind config
│   │   └── utils/         # Helper functions
│   ├── build/             # Compiled output
│   └── package.json       # Dependencies
├── frontend/              # Legacy React frontend (v1)
├── .planning/             # Planning documents, phases
├── tests/                 # Integration tests
└── *.sh                   # Startup scripts
```

## Directory Purposes

**backend:**
- Purpose: Python FastAPI server, all business logic, data persistence
- Contains: Service modules, database models, orchestration engine, worker processes
- Key files: `server.py`, `database/models.py`, `orchestration/engine.py`, `workers/task_worker.py`

**backend/database:**
- Purpose: Data persistence layer, SQLAlchemy ORM models
- Contains: Model definitions (Project, Task, Artifact, etc.), async session management
- Key files: `models.py`, `connection.py`, `credit_models.py`

**backend/orchestration:**
- Purpose: Task orchestration engine, DAG management, state transitions
- Contains: OrchestrationEngine class, dependency resolution, state machine logic
- Key files: `engine.py`

**backend/realtime:**
- Purpose: WebSocket connections, Redis pub/sub for real-time updates
- Contains: ConnectionManager, WebSocket endpoint handler
- Key files: `websocket.py`

**backend/workers:**
- Purpose: Asynchronous task execution layer
- Contains: TaskWorker class, task-specific execution methods
- Key files: `task_worker.py`

**frontend-v2:**
- Purpose: Modern React TypeScript frontend with routing and state management
- Contains: React app source, build configuration, dependencies
- Key files: `src/App.tsx`, `src/index.tsx`, `package.json`

**frontend-v2/src/components:**
- Purpose: Reusable React UI components organized by domain
- Contains: Presentational and container components
- Key files: `layout/WorkspaceLayout.tsx`, `chat/ChatInterface.tsx`, `common/Button.tsx`

**frontend-v2/src/pages:**
- Purpose: Route-level page components corresponding to application routes
- Contains: Page components that compose multiple UI components
- Key files: `GreetingHome.tsx`, `ActiveChat.tsx`, `ProjectWorkspace.tsx`, `TaskGraphView.tsx`, `AgentGraphView.tsx`

**frontend-v2/src/services:**
- Purpose: API client layer, HTTP abstraction
- Contains: Typed fetch wrappers, endpoint-specific service functions
- Key files: `api.ts`, `planning.ts`, `projects.ts`

**frontend-v2/src/stores:**
- Purpose: Client-side state management using Zustand
- Contains: Domain-specific stores (project, auth, credits, UI)
- Key files: `useProjectStore.ts`, `useAuthStore.ts`, `useCreditStore.ts`, `useUIStore.ts`

**frontend-v2/src/types:**
- Purpose: TypeScript type definitions and interfaces
- Contains: Domain models, API request/response types
- Key files: `project.ts`, `task.ts`, `artifact.ts`, `api.ts`

**frontend:**
- Purpose: Legacy React frontend (v1), being replaced by frontend-v2
- Contains: Old React code with different architecture
- Key files: Various (not actively developed)

**.planning:**
- Purpose: Development planning documents, phase specifications
- Contains: Codebase analysis docs, implementation phase plans
- Key files: `codebase/*.md`, `phases/*/PLAN.md`

## Key File Locations

**Entry Points:**
- `/home/zemul/Programming/research/backend/server.py`: FastAPI application, HTTP/WebSocket routes
- `/home/zemul/Programming/research/frontend-v2/src/index.tsx`: React application mount point
- `/home/zemul/Programming/research/frontend-v2/src/App.tsx`: React Router configuration

**Configuration:**
- `/home/zemul/Programming/research/backend/.env`: Backend environment variables (DB, Redis, API keys)
- `/home/zemul/Programming/research/backend/requirements.txt`: Python dependencies
- `/home/zemul/Programming/research/frontend-v2/package.json`: Node dependencies
- `/home/zemul/Programming/research/frontend-v2/tailwind.config.js`: Tailwind CSS configuration

**Core Logic:**
- `/home/zemul/Programming/research/backend/database/models.py`: All SQLAlchemy models (Project, Task, Artifact, etc.)
- `/home/zemul/Programming/research/backend/orchestration/engine.py`: OrchestrationEngine, state transitions, DAG logic
- `/home/zemul/Programming/research/backend/workers/task_worker.py`: TaskWorker, task execution by type
- `/home/zemul/Programming/research/backend/llm_service.py`: LLM integration (OpenAI, Mistral, Groq)
- `/home/zemul/Programming/research/backend/literature_service.py`: Literature search (Semantic Scholar, arXiv)
- `/home/zemul/Programming/research/backend/pdf_service.py`: PDF download and text extraction
- `/home/zemul/Programming/research/backend/reference_service.py`: Citation extraction from PDFs

**Testing:**
- `/home/zemul/Programming/research/backend/tests/`: Backend test files
- `/home/zemul/Programming/research/tests/`: Integration test scripts

## Naming Conventions

**Files:**
- Python: `snake_case.py` (e.g., `llm_service.py`, `task_worker.py`)
- TypeScript: `PascalCase.tsx` for components, `camelCase.ts` for utilities
  - Component: `WorkspaceLayout.tsx`, `ChatInterface.tsx`
  - Hook: `useProjectStore.ts`, `useAuthStore.ts`
  - Utility: `api.ts`, `planning.ts`
- Test files: `test_*.py` (backend), `*.test.ts` or `*.spec.ts` (frontend)

**Directories:**
- Lowercase with underscores: `orchestration/`, `realtime/`
- Feature-based grouping: `components/chat/`, `components/layout/`

**Functions:**
- Python: `snake_case` (e.g., `expand_plan_to_tasks`, `transition_task_state`)
- TypeScript: `camelCase` for functions, `PascalCase` for components/React hooks

**Classes:**
- Python: `PascalCase` (e.g., `OrchestrationEngine`, `TaskWorker`, `ConnectionManager`)
- TypeScript: `PascalCase` for classes/types

**Constants:**
- Python: `UPPER_SNAKE_CASE` (e.g., `REDIS_URL`, `API_BASE_URL`)
- TypeScript: `UPPER_SNAKE_CASE` or `camelCase` depending on scope

## Where to Add New Code

**New Backend Endpoint:**
- Route definition: `/home/zemul/Programming/research/backend/server.py`
- Add to `api_router` with appropriate HTTP method decorator
- Use Pydantic models for request/response in server.py file
- Business logic goes in appropriate service file or new service module

**New Backend Service:**
- Implementation: `/home/zemul/Programming/research/backend/{service_name}_service.py`
- Import pattern: `from {service_name}_service import {service_name}_service`
- Singleton pattern: Create instance at module bottom

**New Task Type:**
- Enum: Add to `/home/zemul/Programming/research/backend/database/models.py` in `TaskType` enum
- Worker method: Add `_execute_{task_type}` in `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Worker routing: Add elif branch in `execute_task()` method

**New Frontend Page:**
- Component: `/home/zemul/Programming/research/frontend-v2/src/pages/{PageName}.tsx`
- Route: Add to `/home/zemul/Programming/research/frontend-v2/src/App.tsx` Routes
- Export: Use named export `export function {PageName}()`

**New Frontend Component:**
- Reusable UI: `/home/zemul/Programming/research/frontend-v2/src/components/{category}/{ComponentName}.tsx`
- Category options: `common/`, `layout/`, `chat/`, `graphs/`, `tasks/`, `artifacts/`, `ui/`, `editor/`
- Export: Use named export, add to `index.ts` barrel file

**New Frontend Service/Client:**
- Service file: `/home/zemul/Programming/research/frontend-v2/src/services/{domain}.ts`
- Import base API: `import { api } from './api'`
- Export functions for each endpoint

**New Frontend State Store:**
- Store file: `/home/zemul/Programming/research/frontend-v2/src/stores/use{Domain}Store.ts`
- Use Zustand: `import { create } from 'zustand'`
- Export: `export const use{Domain}Store = create<{Domain}State>()`

**New Type Definitions:**
- Domain types: `/home/zemul/Programming/research/frontend-v2/src/types/{domain}.ts`
- Export interfaces and types, import into `/home/zemul/Programming/research/frontend-v2/src/types/index.ts`

**Utilities:**
- Backend helpers: Create in appropriate service module or new utility module
- Frontend helpers: `/home/zemul/Programming/research/frontend-v2/src/utils/index.ts` or new utility file

## Special Directories

**backend/venv:**
- Purpose: Python virtual environment for dependencies
- Generated: Yes
- Committed: No (in .gitignore)

**frontend-v2/node_modules:**
- Purpose: Node.js dependencies
- Generated: Yes
- Committed: No (in .gitignore)

**frontend-v2/build:**
- Purpose: Compiled React application for production
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**backend/__pycache__:**
- Purpose: Python bytecode cache
- Generated: Yes
- Committed: No (in .gitignore)

**.planning:**
- Purpose: Development documentation, phase plans, codebase analysis
- Generated: No (manually created)
- Committed: Yes

**frontend:**
- Purpose: Legacy frontend v1
- Generated: No
- Committed: Yes (but not actively developed)

---

*Structure analysis: 2025-01-27*
