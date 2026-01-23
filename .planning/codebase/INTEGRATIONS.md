# External Integrations

**Analysis Date:** 2025-01-23

## APIs & External Services

**Literature Search:**
- Semantic Scholar API - Academic paper search and metadata
  - Base URL: https://api.semanticscholar.org/graph/v1
  - Implementation: `/home/zemul/Programming/research/research/backend/literature_service.py`
  - Rate limiting: 1 request/second minimum interval
  - Fields fetched: paperId, title, abstract, authors, year, citationCount, url, openAccessPdf, references

- arXiv API - Preprint search and retrieval
  - Base URL: https://export.arxiv.org/api/query
  - Implementation: `/home/zemul/Programming/research/research/backend/literature_service.py`
  - Format: XML responses parsed via ElementTree
  - No explicit API key required

**LLM Providers:**
- Emergent Integrations LLM Service - Multi-provider LLM abstraction
  - Package: emergentintegrations 0.1.0
  - Implementation: `/home/zemul/Programming/research/research/backend/llm_service.py`
  - Auth: EMERGENT_LLM_KEY environment variable
  - Supported models: gpt-4.1-mini, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-3-flash-preview
  - Session management: Configurable session_id for conversation continuity

- OpenAI API - Direct integration available (via openai 1.99.9)
  - Not actively used in current codebase

- Google Generative AI - Direct integration available (via google-generativeai 0.8.6)
  - Not actively used in current codebase

- LiteLLM - Unified LLM API interface (via litellm 1.80.0)
  - Included in dependencies but usage unclear

## Data Storage

**Databases:**
- PostgreSQL - Primary relational database
  - Connection: DATABASE_URL environment variable
  - Default: postgresql+asyncpg://research_user:research_pass@localhost:5432/research_pilot
  - ORM: SQLAlchemy with async support
  - Schema location: `/home/zemul/Programming/research/research/backend/database/models.py`
  - Key tables: projects, plans, tasks, task_dependencies, task_runs, artifacts, papers, references, execution_logs
  - Features used: UUID types, JSONB columns, ARRAY types, asyncpg driver

- MongoDB - Driver present but not actively used
  - Client: motor 3.3.1 (async MongoDB driver)
  - Status: Included in requirements but no implementation found

**File Storage:**
- Local filesystem temporary storage - PDF downloads and export processing
  - PDF temp directory: `/tmp/research_pilot_pdfs`
  - Export temp directory: `/tmp/research_pilot_exports`
  - Implementation: `/home/zemul/Programming/research/research/backend/pdf_service.py`

**Caching:**
- Redis - Real-time messaging pub/sub
  - Connection: REDIS_URL environment variable
  - Default: redis://localhost:6379/0
  - Implementation: `/home/zemul/Programming/research/research/backend/realtime/websocket.py`
  - Usage pattern: pub/sub channels for project updates (project:{project_id})
  - Client: redis.asyncio from redis package

## Authentication & Identity

**Auth Provider:**
- None detected - No authentication/authorization implementation found
  - No JWT, OAuth, or session management
  - API endpoints are publicly accessible
  - Recommendations: Add API key authentication or OAuth2

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Rollbar, or similar service integration

**Logs:**
- Python standard logging - Console-based logging
  - Level: INFO
  - Format: timestamp - name - level - message
  - No centralized log aggregation

## CI/CD & Deployment

**Hosting:**
- Not configured - No deployment configuration detected

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or similar configuration

**Container:**
- Emergent container image reference found in `/home/zemul/Programming/research/research/.emergent/emergent.yml`
  - Image: fastapi_react_mongo_shadcn_base_image_cloud_arm:release-21012026-1
  - Job ID: 391ce9d4-5ddd-4dfa-8911-8011649ffb5c
  - Purpose: Appears to be part of an external orchestration/build system

## Environment Configuration

**Required env vars:**
- DATABASE_URL - PostgreSQL connection string
- EMERGENT_LLM_KEY - API key for Emergent LLM service
- REDIS_URL - Redis connection string for pub/sub
- CORS_ORIGINS - Comma-separated list of allowed frontend origins (default: *)
- REACT_APP_BACKEND_URL - Backend API URL for frontend (default in tests: https://papercraft-22.preview.emergentagent.com)

**Secrets location:**
- .env files in backend directory (not committed to git)
- No secrets management service detected

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints for external services

**Outgoing:**
- None detected - No outgoing webhook notifications to external services

## External Tools

**Pandoc - Document Conversion:**
- Installation: System-level binary required
- Implementation: `/home/zemul/Programming/research/research/backend/export_service.py`
- Usage: Converting markdown to PDF, DOCX, HTML
- Fallback: Exports limited to markdown/HTML if Pandoc unavailable
- PDF engine: Attempts weasyprint, falls back to HTML-only output

---

*Integration audit: 2025-01-23*
