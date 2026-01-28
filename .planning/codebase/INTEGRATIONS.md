# External Integrations

**Analysis Date:** 2025-01-27

## APIs & External Services

**LLM Providers:**
- OpenAI - GPT-4.1-mini for text generation
  - SDK/Client: `openai` Python package (AsyncOpenAI)
  - Auth: `OPENAI_API_KEY` environment variable
  - Config: `OPENAI_MODEL=gpt-4.1-mini`
  - Location: `/home/zemul/Programming/research/backend/llm_service.py`

- Google Gemini - 2.5 Flash (primary) with fallbacks to 2.5 Flash Lite and 3.0 Flash Preview
  - SDK/Client: `google-generativeai` Python package
  - Auth: `GEMINI_API_KEY` environment variable
  - Config: `GEMINI_MODEL_PRIMARY`, `GEMINI_MODEL_FALLBACK_1`, `GEMINI_MODEL_FALLBACK_2`
  - Location: `/home/zemul/Programming/research/backend/llm_service.py`

- Mistral AI - Mistral Large 3 model
  - SDK/Client: `mistralai` Python package (async client)
  - Auth: `MISTRAL_API_KEY` environment variable
  - Config: `MISTRAL_MODEL=mistral-large-3`
  - Location: `/home/zemul/Programming/research/backend/llm_service.py`

- Groq - Llama 3.3 70B model
  - SDK/Client: `groq` Python package (AsyncGroq)
  - Auth: `GROQ_API_KEY` environment variable
  - Config: `GROQ_MODEL=llama-3.3-70b`
  - Location: `/home/zemul/Programming/research/backend/llm_service.py`

- OpenRouter - Configurable model (optional)
  - SDK/Client: `openai` Python package (AsyncOpenAI with custom base URL)
  - Auth: `OPENROUTER_API_KEY` environment variable
  - Config: `OPENROUTER_MODEL` (default: meta-llama/llama-3.3-70b)
  - Location: `/home/zemul/Programming/research/backend/llm_service.py`

**Literature Search:**
- Semantic Scholar API - Academic paper search and citation data
  - SDK/Client: Custom httpx.AsyncClient wrapper
  - Auth: `SEMANTIC_SCHOLAR_API_KEY` environment variable (optional, increases rate limits)
  - Base URL: `https://api.semanticscholar.org/graph/v1`
  - Rate limiting: 1 request/second minimum
  - Location: `/home/zemul/Programming/research/backend/literature_service.py` (SemanticScholarClient class)

- arXiv API - Preprint server search
  - SDK/Client: Custom httpx.AsyncClient wrapper with XML parsing
  - Auth: None (public API)
  - Base URL: `https://export.arxiv.org/api/query`
  - Location: `/home/zemul/Programming/research/backend/literature_service.py` (ArxivClient class)

- Unpaywall API - Open access PDF locator
  - SDK/Client: Custom httpx client wrapper
  - Auth: Email-based identification via `UNPAYWALL_EMAIL` environment variable
  - Base URL: `https://api.unpaywall.org/v2`
  - Location: `/home/zemul/Programming/research/backend/literature_service.py` (UnpaywallClient class)

## Data Storage

**Databases:**
- PostgreSQL 15-alpine
  - Connection: `DATABASE_URL` environment variable (format: `postgresql+asyncpg://user:pass@host:port/db`)
  - Client: SQLAlchemy 2.0 async ORM with asyncpg driver
  - Connection config: `/home/zemul/Programming/research/backend/database/connection.py`
  - Models location: `/home/zemul/Programming/research/backend/database/models.py`
  - Default: `postgresql+asyncpg://research_user:research_pass_2024@localhost:5432/research_pilot`
  - Pool size: 10 connections, max overflow 20

**File Storage:**
- Local filesystem - PDF downloads and export files
  - PDF temp directory: `/tmp/research_pilot_pdfs` (configurable via `PDF_TEMP_DIR`)
  - Export temp directory: `/tmp/research_pilot_exports` (configurable via `EXPORT_TEMP_DIR`)
  - Location: `/home/zemul/Programming/research/backend/pdf_service.py`

**Caching:**
- Redis 7-alpine - Pub/sub for WebSocket broadcasts and task coordination
  - Connection: `REDIS_URL` environment variable
  - Client: `redis.asyncio` from redis[hiredis] package
  - Default: `redis://localhost:6379/0`
  - Location: `/home/zemul/Programming/research/backend/realtime/websocket.py`
  - Used by: ConnectionManager for WebSocket pub/sub

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: Python-jose with cryptography backend
  - JWT secret: `JWT_SECRET_KEY` environment variable (default: "your-secret-key-change-in-production")
  - Algorithm: HS256
  - Expiration: 7 days (configurable via `JWT_EXPIRATION_HOURS`)
  - Password hashing: bcrypt via passlib[bcrypt]
  - Location: `/home/zemul/Programming/research/backend/auth_service.py`

## Monitoring & Observability

**Error Tracking:**
- None (uses Python logging with stdlib logger)

**Logs:**
- Python stdlib logging module
- Log level: Configurable via `LOG_LEVEL` environment variable (default: INFO)
- Format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- No centralized log aggregation

## CI/CD & Deployment

**Hosting:**
- Not detected (self-hosted based on Docker compose setup)

**CI Pipeline:**
- None detected (manual testing with pytest)

**Docker Support:**
- Docker Compose configuration for local development
- Location: `/home/zemul/Programming/research/docker-compose.yml`
- Services:
  - PostgreSQL 15-alpine (port 5432)
  - Redis 7-alpine (port 6379)
- No containerization for application code detected

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- At least one LLM provider API key (OPENAI_API_KEY, GEMINI_API_KEY, MISTRAL_API_KEY, or GROQ_API_KEY)
- `JWT_SECRET_KEY` - JWT signing secret (production)

**Optional env vars:**
- `SEMANTIC_SCHOLAR_API_KEY` - Semantic Scholar API key for higher rate limits
- `UNPAYWALL_EMAIL` - Email for Unpaywall API identification
- `CORS_ORIGINS` - Comma-separated list of allowed frontend origins (default: http://localhost:3000,http://localhost:3001)
- `ENVIRONMENT` - Environment name (development/production)
- `LOG_LEVEL` - Logging level (DEBUG/INFO/WARNING/ERROR)
- `MAX_TASK_RETRIES` - Maximum retry attempts for failed tasks (default: 3)
- `PDF_TEMP_DIR` - Temporary directory for PDF downloads
- `EXPORT_TEMP_DIR` - Temporary directory for exports

**Frontend env vars:**
- `REACT_APP_API_URL` - Backend API base URL (default: http://localhost:8000/api)

**Secrets location:**
- Backend: `/home/zemul/Programming/research/backend/.env` (gitignored)
- Template available at: `/home/zemul/Programming/research/backend/.env.template`
- Frontend: No dedicated .env file (uses defaults)

## Webhooks & Callbacks

**Incoming:**
- None (no inbound webhook endpoints detected)

**Outgoing:**
- None (no outgoing webhook integrations detected)

**Real-time Updates:**
- WebSocket connections for live project/task updates
- Endpoint: `/api/ws/{project_id}` (WebSocket route)
- Implementation: `/home/zemul/Programming/research/backend/realtime/websocket.py`
- Pub/sub mechanism: Redis channels broadcast to connected WebSocket clients

---

*Integration audit: 2025-01-27*
