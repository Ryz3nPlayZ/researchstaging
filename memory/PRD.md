# Research Pilot - AI-Native Research Execution System

## Original Problem Statement
Build an AI-native research execution system with autonomous research pipeline execution, full provenance tracking, and observable task execution. The system must support workflows that involve planning, document ingestion, parallel task execution, aggregation, synthesis, and user-visible progress updates.

## Architecture (v3.0 - PostgreSQL/Redis/WebSocket)
- **Backend**: FastAPI + PostgreSQL (SQLAlchemy async) + Redis (task queue/pub-sub)
- **Frontend**: React + Tailwind + Shadcn UI + React Flow
- **LLM**: emergentintegrations (GPT-4.1-mini, Gemini models)
- **Literature**: Semantic Scholar + arXiv APIs
- **PDF Processing**: PyMuPDF + pdfplumber
- **Export**: Pandoc (MD/DOCX/HTML)
- **Real-time**: WebSockets (replaced SSE)

## Database Schema
- **projects**: id, research_goal, output_type, audience, status, task_counts, timestamps
- **plans**: id, project_id, title, summary, phases (JSONB), search_terms, key_themes (immutable after creation)
- **tasks**: id, project_id, name, task_type, state, phase_index, dependencies, timestamps
- **task_dependencies**: DAG edges linking tasks
- **task_runs**: Individual execution attempts per task
- **artifacts**: Versioned outputs from tasks
- **papers**: Academic papers from literature search
- **references**: Citations extracted from papers
- **execution_logs**: Immutable audit trail

## Task States
- PENDING: Created, waiting for dependencies
- READY: Dependencies satisfied, can execute
- RUNNING: Currently executing
- WAITING: Blocked on external input
- COMPLETED: Successfully finished
- FAILED: Execution error
- CANCELLED: Explicitly stopped

## What's Been Implemented (Jan 23, 2026)

### Core Architecture (Complete)
- [x] PostgreSQL database with SQLAlchemy async ORM
- [x] Redis for task queuing and pub/sub real-time events
- [x] WebSocket endpoint at /ws/{project_id} for real-time updates
- [x] State-driven orchestration engine with DAG validation
- [x] Task worker with async execution and retry logic
- [x] Connection manager for WebSocket broadcasts

### Backend API (Complete)
- [x] Health check with feature flags
- [x] Projects CRUD with cascade delete
- [x] Tasks list with state field
- [x] Task graph endpoint (React Flow format)
- [x] Agent graph endpoint (n8n-style visualization)
- [x] Artifacts CRUD with versioning
- [x] Papers list by project
- [x] Stats endpoint
- [x] Execute pipeline endpoint
- [x] Export formats endpoint
- [x] AI action endpoints

### Frontend UI (Complete)
- [x] **Dashboard**: Welcome hero, stats cards, recent projects
- [x] **3-Panel Layout**: Navigator, Workspace, Inspector (resizable)
- [x] **Navigator**: Projects, Tasks, Documents, Literature sections
- [x] **Workspace**: Overview, Task Graph, Agent Graph tabs
- [x] **Inspector**: Item metadata, provenance info
- [x] **Task Graph**: React Flow DAG visualization with status colors
- [x] **Agent Graph**: n8n-style orchestration view
- [x] **WebSocket Integration**: Real-time task updates
- [x] **Theme**: Default light mode with dark toggle

### Planning Flow (Complete)
- [x] Guided multi-step wizard
- [x] LLM plan generation
- [x] Plan caching (no redundant API calls)

### Services (Complete)
- [x] LLM service with Emergent integrations
- [x] Literature search (Semantic Scholar + arXiv)
- [x] PDF acquisition and parsing
- [x] Reference extraction
- [x] Export service (MD/HTML/DOCX)

## API Endpoints

### Projects
- GET /api/projects - List all projects
- POST /api/projects - Create project with auto task generation
- GET /api/projects/{id} - Get project details
- DELETE /api/projects/{id} - Delete with cascade
- POST /api/projects/{id}/execute - Start pipeline execution
- POST /api/projects/{id}/execute-all - Alias for execute

### Tasks
- GET /api/projects/{id}/tasks - List project tasks
- GET /api/projects/{id}/task-graph - DAG visualization data
- GET /api/projects/{id}/agent-graph - Agent orchestration data
- GET /api/tasks/{id} - Get task details
- POST /api/tasks/{id}/retry - Retry failed task

### Artifacts & Papers
- GET /api/projects/{id}/artifacts - List artifacts
- GET /api/artifacts/{id} - Get artifact
- PUT /api/artifacts/{id}/content - Update content (creates version)
- POST /api/artifacts/{id}/export - Export to format
- GET /api/projects/{id}/papers - List papers

### Planning
- POST /api/planning/generate-plan - LLM plan generation
- POST /api/planning/approve - Approve plan, create project

### Other
- GET /api/stats - Global statistics
- GET /api/export/formats - Available formats
- POST /api/ai/action - AI text actions

### WebSocket
- WS /ws/{project_id} - Real-time project updates

## Environment Variables
### Backend (.env)
- DATABASE_URL: PostgreSQL connection string
- REDIS_URL: Redis connection string
- MONGO_URL: Legacy (kept for reference)
- DB_NAME: Legacy database name
- EMERGENT_LLM_KEY: Universal LLM API key
- CORS_ORIGINS: Allowed origins
- WORKER_CONCURRENCY: Task worker threads

### Frontend (.env)
- REACT_APP_BACKEND_URL: API base URL

## Test Results
- Backend: 100% (14/14 tests passed)
- Frontend: 100% (all UI components functional)
- Test file: /app/backend/tests/test_api.py

## Prioritized Backlog

### P0 (Critical - Next)
- [ ] Full DAG execution with live task status updates
- [ ] Error recovery and task retry UI

### P1 (High)
- [ ] Citation network visualization
- [ ] Full-text integration in synthesis
- [ ] Batch export all documents
- [ ] PDF viewer in workspace

### P2 (Future)
- [ ] Collections and tagging
- [ ] Document version history with diff view
- [ ] Research templates
- [ ] User authentication
- [ ] Collaboration features
- [ ] Enhanced AI editor actions (rewrite, expand, cite)
