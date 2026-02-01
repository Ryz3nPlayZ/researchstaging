# Technology Stack

**Analysis Date:** 2025-01-31

## Languages

**Primary:**
- Python 3.14.2 - Backend API, services, database models, orchestration, workers
- JavaScript (React 19.0.0) - Frontend UI

**Secondary:**
- JSX - Frontend components
- SQL - Database queries (via SQLAlchemy ORM)

## Runtime

**Environment:**
- Python 3.14.2 (backend)
- Node.js v20.20.0 (frontend)
- Docker & Docker Compose (infrastructure)

**Package Manager:**
- Python: pip with virtual environment (`backend/venv/`)
- Frontend: yarn 1.22.22
- Lockfile: `backend/requirements.txt`, `frontend/package.json`

## Frameworks

**Core:**
- FastAPI 0.110-0.119 - Python async web framework for backend API (`backend/server.py`)
- React 19.0.0 - Frontend UI framework (`frontend/src/`)
- React Router DOM 7.5.1 - Client-side routing
- Starlette 0.37-0.45 - ASGI framework (FastAPI dependency)

**Testing:**
- pytest 7.4-8.0 - Python test runner
- pytest-asyncio 0.21-1.0 - Async test support
- CRA Test Utils (react-scripts) - Frontend testing

**Build/Dev:**
- CRACO 7.1.0 - Create React App configuration override (`frontend/craco.config.js`)
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- Uvicorn 0.25-0.34 - ASGI server for FastAPI

## Key Dependencies

**Critical:**

**Backend:**
- SQLAlchemy 2.0 - Async ORM for PostgreSQL (`backend/database/`)
- AsyncPG 0.29-0.30 - Async PostgreSQL driver
- Pydantic 2.0 - Data validation and settings
- python-dotenv 1.0 - Environment configuration
- Redis[hiredis] 5.0 - Task queue and caching (`backend/`)

**Frontend:**
- Radix UI - Comprehensive headless UI component library (@radix-ui/* packages)
- TipTap 3.17.0 - Rich text editor
- ReactFlow 11.11.4 - Workflow graph visualization
- Axios 1.8.4 - HTTP client
- Zod 3.24.4 - Schema validation
- React Hook Form 7.56.2 - Form management

**Infrastructure:**
- httpx 0.27-0.28 - Async HTTP client for API calls
- aiohttp 3.9 - Async HTTP for websockets
- websockets 12.0-15.0 - WebSocket support (`backend/realtime/`)

## Configuration

**Environment:**
- python-dotenv for loading `.env` files
- Backend config: `backend/.env` (template at `backend/.env.template`)
- Frontend config: `frontend/.env` (template at `frontend/.env.example`)
- Config-loaded at runtime in `backend/server.py` and frontend entry points

**Key configs required:**

Backend (`backend/.env`):
- Database: `DATABASE_URL` (PostgreSQL connection string)
- Redis: `REDIS_URL` (Redis connection string)
- LLM API keys: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`
- External APIs: `SEMANTIC_SCHOLAR_API_KEY`, `UNPAYWALL_EMAIL`
- CORS: `CORS_ORIGINS` (comma-separated frontend URLs)
- Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET_KEY`

Frontend (`frontend/.env`):
- API endpoint: `REACT_APP_API_URL`

**Build:**
- Backend: No build step required (Python runtime)
- Frontend: CRACO config at `frontend/craco.config.js`
- Tailwind: `frontend/tailwind.config.js`
- PostCSS: `frontend/postcss.config.js`

## Platform Requirements

**Development:**
- Python 3.10+ (3.14.2 tested)
- Node.js 20.x (v20.20.0 tested)
- Yarn 1.22.22
- PostgreSQL 15 (via Docker or native)
- Redis 7 (via Docker or native)
- Pandoc (for PDF/DOCX export functionality)

**Production:**
- Backend: Linux server with Python 3.10+ runtime
- Frontend: Static file hosting (nginx, AWS S3+CloudFront, Vercel, etc.)
- Database: PostgreSQL 15+ (managed or self-hosted)
- Cache/Queue: Redis 7+
- Optional: Docker containerization

---

*Stack analysis: 2025-01-31*
