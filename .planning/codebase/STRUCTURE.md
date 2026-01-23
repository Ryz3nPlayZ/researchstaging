# Codebase Structure

**Analysis Date:** 2025-01-23

## Directory Layout

```
research/
├── backend/                    # Python FastAPI backend
│   ├── database/              # SQLAlchemy ORM models and connection
│   ├── orchestration/         # Task DAG orchestration engine
│   ├── realtime/              # WebSocket and Redis pub/sub
│   ├── workers/               # Background task execution workers
│   ├── tests/                 # Backend tests
│   ├── server.py              # Main FastAPI application
│   ├── task_executor.py       # Legacy task executor (deprecated)
│   ├── models.py              # Pydantic/response models (legacy)
│   ├── llm_service.py         # LLM integration
│   ├── literature_service.py  # Academic search APIs
│   ├── pdf_service.py         # PDF processing
│   ├── reference_service.py   # Citation extraction
│   ├── export_service.py      # Document export
│   ├── planning_service.py    # Research plan generation
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React frontend application
│   ├── public/                # Static assets
│   ├── plugins/               # Webpack/Babel plugins
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── dialogs/       # Modal dialogs
│   │   │   ├── editor/        # Rich text editor (Tiptap)
│   │   │   ├── graphs/        # Visualization components
│   │   │   ├── layout/        # Layout components (Navigator, Workspace, Inspector)
│   │   │   ├── pages/         # Page components (Dashboard, PlanningFlow)
│   │   │   ├── tasks/         # Task-related components
│   │   │   └── ui/            # Reusable UI components (shadcn/ui)
│   │   ├── context/           # React context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and API client
│   │   ├── App.js             # Root application component
│   │   ├── index.js           # React entry point
│   │   └── App.css            # Global styles
│   ├── package.json           # Node dependencies
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── craco.config.js        # Create React App override config
│   └── postcss.config.js      # PostCSS configuration
├── tests/                     # Shared/integration tests
├── test_reports/              # Test output reports
├── .emergent/                 # Emergent Integrations local cache
└── memory/                    # In-memory data storage (development)
```

## Directory Purposes

**backend/database/:**
- Purpose: SQLAlchemy ORM models defining database schema and async session management
- Contains: Model definitions (Project, Plan, Task, etc.), connection factory, exports
- Key files: `models.py`, `connection.py`, `__init__.py`

**backend/orchestration/:**
- Purpose: Task orchestration engine for plan expansion and state machine management
- Contains: OrchestrationEngine class with task lifecycle methods
- Key files: `engine.py`, `__init__.py`

**backend/realtime/:**
- Purpose: WebSocket connection management and Redis pub/sub for real-time updates
- Contains: ConnectionManager class, WebSocket endpoint handler
- Key files: `websocket.py`, `__init__.py`

**backend/workers/:**
- Purpose: Background worker that pulls tasks from Redis queue and executes them
- Contains: TaskWorker class with execution logic for each task type
- Key files: `task_worker.py`, `__init__.py`

**frontend/src/components/layout/:**
- Purpose: Main layout components for the 3-panel workspace UI
- Contains: StatusBar, Navigator, Workspace, Inspector with resizable panels
- Key files: `StatusBar.js`, `Navigator.js`, `Workspace.js`, `Inspector.js`

**frontend/src/components/pages/:**
- Purpose: Top-level page components for different application views
- Contains: Dashboard (project list), PlanningFlow (guided research setup)
- Key files: `Dashboard.js`, `PlanningFlow.js`

**frontend/src/components/ui/:**
- Purpose: Reusable UI components built with Radix UI primitives and Tailwind CSS
- Contains: Button, Input, Dialog, Tabs, and other base components (shadcn/ui pattern)
- Key files: All individual component files following kebab-case naming

**frontend/src/components/graphs/:**
- Purpose: Data visualization components using ReactFlow and Recharts
- Contains: Task DAG visualization, agent graph, citation network
- Key files: `TaskDAGGraph.js`, `AgentGraph.js`, `CitationNetwork.js`

**frontend/src/context/:**
- Purpose: React Context providers for global state management
- Contains: ThemeContext (dark/light mode), ProjectContext (selected project/task/artifact)
- Key files: `ThemeContext.js`, `ProjectContext.js`

**frontend/src/lib/:**
- Purpose: Utility functions and API client
- Contains: Axios instance with baseURL, API endpoint methods, WebSocket connection factory
- Key files: `api.js`, `utils.js`

## Key File Locations

**Entry Points:**
- `research/backend/server.py`: FastAPI application with all API routes
- `research/frontend/src/index.js`: React DOM rendering entry point
- `research/frontend/src/App.js`: Root React component with routing and context

**Configuration:**
- `research/backend/.env`: Environment variables (database URL, Redis URL, API keys)
- `research/frontend/package.json`: Node dependencies and scripts
- `research/backend/requirements.txt`: Python dependencies

**Core Logic:**
- `research/backend/orchestration/engine.py`: Task DAG orchestration
- `research/backend/workers/task_worker.py`: Task execution with retry logic
- `research/backend/database/models.py`: SQLAlchemy ORM models

**API Layer:**
- `research/backend/server.py`: All FastAPI endpoint definitions (projects, tasks, artifacts, papers)

**Frontend Core:**
- `research/frontend/src/lib/api.js`: Axios API client with endpoint methods
- `research/frontend/src/context/ProjectContext.js`: Global project state
- `research/frontend/src/App.js`: View state management (dashboard/planning/workspace)

**Testing:**
- `research/backend/tests/`: Backend integration tests
- `research/tests/`: Shared/integration tests
- `research/test_reports/pytest/`: Pytest output

## Naming Conventions

**Files:**
- Python: `snake_case.py` (e.g., `llm_service.py`, `task_worker.py`)
- JavaScript: `PascalCase.js` for components (e.g., `Dashboard.js`), `camelCase.js` for utilities (e.g., `api.js`)
- CSS: `kebab-case.css` (e.g., global styles in `App.css`)

**Directories:**
- Python: `snake_case` (e.g., `database/`, `orchestration/`)
- JavaScript: `camelCase` or `kebab-case` (e.g., `components/`, `test_reports/`)

**Database Models:**
- SQLAlchemy: `PascalCase` (e.g., `Project`, `Task`, `TaskDependency`)
- Tables: `snake_case` (e.g., `projects`, `task_dependencies`)

**API Endpoints:**
- Routes: `kebab-case` (e.g., `/api/projects/{id}/execute-all`)
- Pydantic Models: `PascalCase` with suffix (e.g., `ProjectCreate`, `TaskResponse`)

**React Components:**
- Components: `PascalCase` (e.g., `Dashboard`, `PlanningFlow`, `StatusBar`)
- Files: Match component name (e.g., `Dashboard.js`)

**Functions:**
- Python: `snake_case` (e.g., `expand_plan_to_tasks`, `transition_task_state`)
- JavaScript: `camelCase` (e.g., `useProject`, `createWebSocketConnection`)

## Where to Add New Code

**New Feature (Backend):**
- Primary code: `research/backend/server.py` (for new API endpoints)
- Database: `research/backend/database/models.py` (for new models)
- Orchestration: `research/backend/orchestration/engine.py` (for new task types)
- Service: `research/backend/{feature}_service.py` (for new external integrations)
- Tests: `research/backend/tests/test_{feature}.py`

**New Feature (Frontend):**
- Page component: `research/frontend/src/components/pages/{FeaturePage}.js`
- UI components: `research/frontend/src/components/ui/{feature}-components.js`
- API methods: `research/frontend/src/lib/api.js` (add to existing API objects)
- Tests: `research/frontend/src/components/__tests__/{FeaturePage}.test.js`

**New Component/Module:**
- Implementation: `research/backend/{module_name}/` (create new directory)
- Export: `research/backend/{module_name}/__init__.py`
- Import: `from {module_name} import {ClassName}`

**New Task Type:**
- Orchestration: Add enum to `TaskType` in `research/backend/database/models.py`
- Worker: Add `_execute_{task_type}` method to `research/backend/workers/task_worker.py`
- Mapping: Add to `_map_task_type()` in `research/backend/orchestration/engine.py`

**Utilities:**
- Shared helpers: `research/frontend/src/lib/utils.js`
- Backend utilities: `research/backend/utils.py` (create if needed)

## Special Directories

**.emergent/:**
- Purpose: Local cache for Emergent Integrations library (LLM provider abstraction)
- Generated: Yes
- Committed: Yes (gitignored contents)

**memory/:**
- Purpose: In-memory data storage for development/testing
- Generated: Yes
- Committed: No (development only)

**test_reports/:**
- Purpose: Pytest output reports and coverage HTML
- Generated: Yes
- Committed: No

**frontend/plugins/:**
- Purpose: Custom webpack/Babel plugins for development tooling
- Generated: No
- Committed: Yes
- Contains:
  - `health-check/`: Webpack health check plugin
  - `visual-edits/`: Babel metadata plugin for visual editing

**frontend/public/:**
- Purpose: Static assets served directly (favicon, manifest, images)
- Generated: No
- Committed: Yes

**frontend/node_modules/:**
- Purpose: Node.js dependencies
- Generated: Yes
- Committed: No (gitignored)

---

*Structure analysis: 2025-01-23*
