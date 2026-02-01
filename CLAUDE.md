# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Research Pilot** is an AI-native research execution system that transforms high-level research goals into structured, defensible outputs (literature reviews, research papers) with full provenance tracking. This is an **execution system**, not a conversational AI assistant.

**Authoritative Documentation**: [MASTER_SOURCE_OF_TRUTH.md](MASTER_SOURCE_OF_TRUTH.md) is the binding specification for all product and architectural decisions. Always reference it before implementing features.

## Core Philosophy

### What This System Is
- **Stateful execution pipeline**: Research tasks as a DAG of persisted operations
- **IDE-like interface**: Navigator/Workspace/Inspector layout for visibility
- **Provenance-first**: Every artifact traceable to source tasks and inputs
- **Minimal front-loaded input**: Only ask output type and audience initially

### What This System Is NOT
- ❌ Conversational AI chatbot
- ❌ Research "assistant" that asks questions mid-execution
- ❌ Stateless prompt chaining system
- ❌ Tool that asks about methods/datasets/gaps before literature review

## Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI with async/await throughout
- **Database**: PostgreSQL with SQLAlchemy (AsyncSession, asyncpg driver)
- **Task Queue**: Redis for pub/sub coordination
- **LLM Providers**: Multi-provider support (OpenAI, Gemini, Mistral, Groq) via `llm_service.py`
- **Real-time**: WebSocket server in `realtime/websocket.py`

### Frontend (React)
- **Framework**: React 19 with TypeScript support (currently JS)
- **UI Library**: Radix UI components (Shadcn UI)
- **Styling**: Tailwind CSS
- **State Management**: React Context API (`ProjectContext.js`, `ThemeContext.js`)
- **Rich Text**: TipTap editor for document editing
- **Visualization**: React Flow for task DAGs

### TUI (Terminal UI)
- **Framework**: Textual (Python)
- **Location**: `research_tui/` directory
- **Independent package**: Separate from main web UI

## Quick Start Commands

### First-Time Setup
```bash
./setup.sh                    # Automated setup (installs dependencies, creates .env)
./docker-start.sh             # Start PostgreSQL + Redis via Docker
# Add API keys to backend/.env (at least one LLM provider)
python backend/scripts/migrate_add_credits.py  # Run database migrations
./run-all.sh                  # Start backend + frontend
```

### Development Workflow
```bash
# Backend (Terminal 1)
cd backend && source venv/bin/activate && python server.py  # Runs on :8000

# Frontend (Terminal 2)
cd frontend && yarn start  # Runs on :5173

# Or use combined script
./run-all.sh  # Starts both, Ctrl+C to stop
```

### Testing
```bash
# Backend tests
cd backend && pytest

# API tests (requires running server)
pytest backend/tests/test_api.py
```

### Code Quality
```bash
# Backend
cd backend
black .              # Format code
flake8 .             # Lint
mypy .               # Type check
isort .              # Sort imports

# Frontend
cd frontend
yarn lint            # ESLint
```

## Key Architecture Patterns

### State-Driven Orchestration
All workflow execution governed by persisted state, not in-memory logic:
- **Projects**: Research efforts with goal, output type, audience, status
- **Plans**: Immutable research plans with phases, search terms, themes
- **Tasks**: Units of work with state machine (PENDING → READY → RUNNING → COMPLETED/FAILED)
- **Task Dependencies**: DAG edges linking tasks
- **Task Runs**: Individual execution attempts with retry logic
- **Artifacts**: Versioned outputs (papers, summaries, drafts, references)
- **Execution Logs**: Immutable audit trail

### Task State Machine
```
PENDING → READY → RUNNING → WAITING → COMPLETED/FAILED
```

Critical rule: **Never update task status directly without going through the orchestration engine**.

### Service Layer Architecture
Backend services encapsulate external logic:
- `llm_service.py`: Multi-provider LLM calls with fallback support
- `literature_service.py`: Semantic Scholar + arXiv API integration
- `pdf_service.py`: PDF download and parsing (PyMuPDF, pdfplumber)
- `reference_service.py`: Citation extraction and normalization
- `planning_service.py`: Research plan generation
- `export_service.py`: Document export via Pandoc
- `auth_service.py`: JWT + Google OAuth
- `credit_service.py`: API usage/cost tracking

### Research Pipeline Flow
1. **Literature Discovery**: Query APIs (Semantic Scholar, arXiv)
2. **PDF Acquisition**: Download and parse papers
3. **Reference Extraction**: Parse citations, build citation graph
4. **Thematic Synthesis**: Cluster papers by theme, identify patterns
5. **Draft Generation**: Create structured documents with citations
6. **Quality Evaluation**: (Optional) Score outputs and validate

## Critical Development Rules

### Forbidden Questions (Before Literature Review)
The system **MUST NOT** ask users these questions before literature review:
- ❌ Datasets to use
- ❌ Specific methods or methodologies
- ❌ Variables to analyze
- ❌ Research gaps
- ❌ Hypotheses
- ❌ Analytical approaches

**Rationale**: These are unknowable before literature review. Asking them leads to invalid, biased answers and violates research process.

### Allowed Questions (Initial Phase Only)
- ✅ Output type (research paper, literature review)
- ✅ Intended audience (academic, industry, policy, general)

### Backend Patterns
- **Always use async/await** for DB operations (SQLAlchemy `AsyncSession`)
- **Never manually update task status** - use orchestration engine
- **Use `llm_service.py`** for all LLM calls (supports provider fallback)
- **Emit WebSocket events** for state changes so frontend updates
- **Log all task execution** to `execution_logs` table for auditability

### Frontend Patterns
- **Follow 3-panel layout**: Navigator (left), Workspace (center), Inspector (right)
- **Use Context providers** for global state (`ProjectContext`, `ThemeContext`)
- **Create WebSocket connection** via `createWebSocketConnection` in `lib/api.js`
- **Never poll** for updates - use WebSocket for real-time data
- **Show progress indicators** for all long-running operations

### Prohibited Patterns
- ❌ **No conversational AI features**: This is not a chat app
- ❌ **No manual state overrides**: Always use orchestration engine
- ❌ **No SSE (Server-Sent Events)**: Use WebSockets only
- ❌ **No premature questions**: Defer all research-specific questions until after literature review
- ❌ **No "smart" agents**: Workers should be narrow and execute tasks, not make decisions

## Environment Configuration

### Backend (`backend/.env`)
Required variables:
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/research_pilot
REDIS_URL=redis://localhost:6379/0

# At least one LLM provider required:
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
GROQ_API_KEY=...

# Optional (for authentication):
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET_KEY=...

# CORS (for development):
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:8000
```

## Database Schema

### Core Tables
- `projects`: Top-level research efforts
- `plans`: Immutable research plans
- `tasks`: Units of work with dependencies
- `task_dependencies`: DAG edges
- `task_runs`: Individual execution attempts
- `artifacts`: Versioned outputs (papers, summaries, drafts)
- `papers`: Discovered literature
- `references`: Extracted citations
- `execution_logs`: Immutable audit trail
- `credits`: API usage/cost tracking

### Schema Management
- **ORM**: SQLAlchemy with automatic schema creation on server start
- **Migrations**: Custom scripts in `backend/scripts/` (e.g., `migrate_add_credits.py`)
- **Reset**: Drop and recreate database, then restart server (tables auto-create)

## API Structure

### Base URL: `http://localhost:8000/api/`

### Key Endpoints
- `GET /` - Health check
- `GET /projects` - List all projects
- `POST /projects` - Create new project
- `GET /projects/{id}` - Get project details
- `POST /projects/{id}/plan` - Generate research plan
- `POST /projects/{id}/execute` - Start execution
- `GET /projects/{id}/tasks` - List project tasks
- `GET /projects/{id}/artifacts` - List project artifacts
- `GET /artifacts/{id}` - Get artifact content
- `WebSocket /ws/{project_id}` - Real-time project updates

### Interactive Docs
Visit `http://localhost:8000/docs` for auto-generated API documentation (Swagger UI).

## Troubleshooting

### Database Issues
```bash
# Check PostgreSQL running
pg_isready

# Test connection
psql -U research_user -d research_pilot -h localhost

# Reset database (⚠️ deletes all data)
sudo -u postgres psql
DROP DATABASE research_pilot;
CREATE DATABASE research_pilot;
GRANT ALL PRIVILEGES ON DATABASE research_pilot TO research_user;
\q
# Then restart backend (tables auto-create)
```

### Redis Issues
```bash
# Check Redis running
redis-cli ping  # Should return PONG

# Start if not running
redis-server
# Or via Docker: ./docker-start.sh
```

### Port Conflicts
```bash
# Kill process using port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Task Execution Stuck
- Check backend logs for errors
- Verify Redis is running (`redis-cli ping`)
- Check database connection
- Inspect `tasks` table: `SELECT * FROM tasks WHERE status = 'RUNNING';`

## Development Principles

### Speed to MVP
- ✅ Use established, well-documented technologies
- ✅ Build for the happy path first
- ✅ Add error handling based on real usage
- ❌ Avoid premature optimization
- ❌ Avoid over-engineering
- ❌ Avoid speculative features

### Iterate Based on Usage
> "Generate revenue, then iterate based on real usage rather than speculative architecture."

The system should be:
1. Functional for the core use case
2. Reliable enough for real research workflows
3. Sufficient for users to see immediate value
4. Ready for improvement based on actual usage patterns

## File Reference

### Critical Files to Understand
- [MASTER_SOURCE_OF_TRUTH.md](MASTER_SOURCE_OF_TRUTH.md) - Authoritative product spec
- [backend/server.py](backend/server.py) - FastAPI application setup
- [backend/database/models.py](backend/database/models.py) - SQLAlchemy data models
- [backend/orchestration/engine.py](backend/orchestration/engine.py) - Task orchestration
- [backend/llm_service.py](backend/llm_service.py) - Multi-provider LLM interface
- [frontend/src/lib/api.js](frontend/src/lib/api.js) - API clients + WebSocket
- [frontend/src/context/ProjectContext.js](frontend/src/context/ProjectContext.js) - Global state

### Testing Files
- [backend/tests/test_api.py](backend/tests/test_api.py) - API integration tests

### Setup Scripts
- `setup.sh` - First-time setup automation
- `docker-start.sh` - Start Docker services (PostgreSQL + Redis)
- `run-all.sh` - Start backend + frontend together
- `run-backend.sh` - Start only backend
- `run-frontend.sh` - Start only frontend

See [SCRIPTS_README.md](SCRIPTS_README.md) for complete script documentation.

## Additional Documentation

- [README.md](README.md) - Project overview and quick start
- [SETUP.md](SETUP.md) - Detailed local setup guide
- [SCRIPTS_README.md](SCRIPTS_README.md) - Shell scripts reference
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Copilot-specific guidance
