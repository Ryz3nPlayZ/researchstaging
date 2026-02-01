# External Integrations

**Analysis Date:** 2025-01-31

## APIs & External Services

**LLM Providers:**
- OpenAI (GPT-4.1-mini) - Text generation, summarization, research planning
  - SDK/Client: `openai>=1.0.0` (AsyncOpenAI)
  - Auth: `OPENAI_API_KEY` env var
  - Implementation: `backend/llm_service.py`

- Google Generative AI (Gemini 2.5 Flash, 2.5 Flash Lite, 3.0 Flash Preview) - Text generation with multi-model fallback
  - SDK/Client: `google-generativeai>=0.8.0`
  - Auth: `GEMINI_API_KEY` env var
  - Implementation: `backend/llm_service.py`

- Mistral AI (Mistral Large 3) - Text generation
  - SDK/Client: `mistralai>=1.0.0` (AsyncMistralClient)
  - Auth: `MISTRAL_API_KEY` env var
  - Implementation: `backend/llm_service.py`

- Groq (Llama 3.3 70B) - Fast text generation
  - SDK/Client: `groq>=0.10.0` (AsyncGroq)
  - Auth: `GROQ_API_KEY` env var
  - Implementation: `backend/llm_service.py`

- OpenRouter (Configurable models) - Meta-LLM aggregator
  - SDK/Client: OpenAI SDK with custom base URL
  - Auth: `OPENROUTER_API_KEY` env var
  - Implementation: `backend/llm_service.py`

**Academic & Literature APIs:**
- Semantic Scholar API - Academic paper search and metadata
  - Base URL: `https://api.semanticscholar.org/graph/v1`
  - Client: httpx async HTTP client
  - Auth: `SEMANTIC_SCHOLAR_API_KEY` env var (optional, increases rate limits)
  - Rate limit: 1 request/second self-imposed
  - Implementation: `backend/literature_service.py` (SemanticScholarClient)

- arXiv API - Preprint search and retrieval
  - Base URL: `https://export.arxiv.org/api/query`
  - Client: httpx with XML parsing
  - Auth: None required (public API)
  - Implementation: `backend/literature_service.py` (ArxivClient)

- Unpaywall API - Open access PDF location
  - Base URL: `https://api.unpaywall.org/v2`
  - Client: httpx async HTTP client
  - Auth: `UNPAYWALL_EMAIL` env var (required for polite API usage)
  - Implementation: `backend/literature_service.py` (UnpaywallClient)

**Authentication:**
- Google OAuth 2.0 - User authentication
  - Provider: Google Identity Platform
  - Implementation: Custom OAuth flow in `backend/auth_service.py`
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` env vars
  - Token: JWT with python-jose (HS256, 7-day expiration)
  - Auth URL: Generated dynamically by AuthService

## Data Storage

**Databases:**
- PostgreSQL 15 (async)
  - Connection: `DATABASE_URL` env var (format: `postgresql+asyncpg://user:pass@host:port/db`)
  - Client: SQLAlchemy 2.0 async ORM with AsyncPG driver
  - Schema: Auto-generated from `backend/database/models.py`
  - Migrations: Not configured (manual schema management)
  - Models: Project, Plan, Task, TaskDependency, TaskRun, Artifact, Paper, Reference, ExecutionLog, User, CreditTransaction, CreditPackage
  - Docker: `postgres:15-alpine` image in `docker-compose.yml`

**File Storage:**
- Local filesystem (temporary)
  - PDF downloads: `/tmp/research_pilot_pdfs` (configurable via `PDF_TEMP_DIR`)
  - Export temp files: `/tmp/research_pilot_exports` (configurable via `EXPORT_TEMP_DIR`)
  - Implementation: `backend/pdf_service.py`, `backend/export_service.py`

**Caching:**
- Redis 7
  - Connection: `REDIS_URL` env var (format: `redis://localhost:6379/0`)
  - Purpose: Task queue, job state management (via custom worker in `backend/workers/`)
  - Client: redis[hiredis] 5.0+
  - Docker: `redis:7-alpine` image in `docker-compose.yml`

## Authentication & Identity

**Auth Provider:**
- Google OAuth 2.0
  - Implementation: Custom service (`backend/auth_service.py`)
  - Flow: Authorization code grant with PKCE support
  - Token storage: PostgreSQL User table
  - Session management: JWT tokens with 7-day expiration
  - Secret: `JWT_SECRET_KEY` env var (change in production)

**Credit System:**
- Custom credit-based usage tracking
  - Implementation: `backend/credit_service.py`
  - Purpose: Track and limit LLM API usage
  - Free tier: 1000 initial credits for new users
  - Storage: PostgreSQL (User, CreditTransaction tables)

## Monitoring & Observability

**Error Tracking:**
- None (Python logging only)
  - Framework: Standard `logging` module
  - Level: Configurable via `LOG_LEVEL` env var (default: INFO)
  - Output: Console/stdout

**Logs:**
- Python logging module
  - Backend: Structured logs to console
  - Format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
  - Configuration: `backend/server.py` (lines 49-52)

## CI/CD & Deployment

**Hosting:**
- Development: Local development server (Uvicorn for backend, CRACO dev server for frontend)
- Production: Not configured (manual deployment)

**CI Pipeline:**
- None (no GitHub Actions or other CI detected)
  - No workflow files in `.github/workflows/`
  - Manual testing and deployment

## Environment Configuration

**Required env vars:**

Backend (`backend/.env`):
- Database: `DATABASE_URL`
- Redis: `REDIS_URL`
- At least one LLM provider:
  - `OPENAI_API_KEY` OR
  - `GEMINI_API_KEY` OR
  - `MISTRAL_API_KEY` OR
  - `GROQ_API_KEY`
- External APIs: `SEMANTIC_SCHOLAR_API_KEY`, `UNPAYWALL_EMAIL`
- CORS: `CORS_ORIGINS`
- Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET_KEY`
- Config: `ENVIRONMENT` (development/production), `LOG_LEVEL`

Frontend (`frontend/.env`):
- API: `REACT_APP_API_URL` (default: http://localhost:8000)

**Secrets location:**
- Backend: `backend/.env` (gitignored)
- Frontend: `frontend/.env` (gitignored)
- Templates provided: `backend/.env.template`, `frontend/.env.example`

## Webhooks & Callbacks

**Incoming:**
- Google OAuth callback: `/auth/callback` (handled by frontend, redirects to backend)
- WebSocket endpoint: `/ws/{project_id}` for real-time project updates (`backend/realtime/websocket.py`)

**Outgoing:**
- None (no outbound webhooks configured)
- All external integrations use direct API calls (no webhooks from external services)

## Additional External Dependencies

**Document Processing:**
- Pandoc (system binary) - Document conversion for export (PDF, DOCX, HTML)
  - Required for: `backend/export_service.py`
  - Check: Runtime subprocess call to `pandoc --version`
  - Install: System package manager (apt, brew, etc.)

**PDF Processing Libraries:**
- PyMuPDF (fitz) 1.23+ - Fast PDF text extraction
- pdfplumber 0.10+ - Table extraction from PDFs
- pdfminer.six - Alternative PDF parsing

---

*Integration audit: 2025-01-31*
