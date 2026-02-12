# External Integrations

**Analysis Date:** 2026-02-11

## LLM Providers

### OpenAI
**Purpose:** Primary LLM provider
**Service:** `llm_service.py`
**Models:** GPT-4, GPT-3.5-turbo
**Key:** `OPENAI_API_KEY` in `.env`
**Fallback:** Yes - system supports multi-provider fallback

### Google Gemini
**Purpose:** Alternative LLM provider
**Service:** `llm_service.py`
**Key:** `GEMINI_API_KEY` in `.env`
**Status:** Configured as fallback option

### Mistral AI
**Purpose:** European LLM provider
**Service:** `llm_service.py`
**Key:** `MISTRAL_API_KEY` in `.env`

### Groq
**Purpose:** Fast inference provider
**Service:** `llm_service.py`
**Key:** `GROQ_API_KEY` in `.env`

## Academic APIs

### Semantic Scholar
**Purpose:** Literature search and paper metadata
**Service:** `literature_service.py`
**Endpoint:** `https://api.semanticscholar.org/graph/v1`
**Auth:** API key optional (rate limited without)
**Usage:** Paper discovery, citation graphs, related papers

### arXiv
**Purpose:** Preprint paper access
**Service:** `literature_service.py`
**Endpoint:** `http://export.arxiv.org/api/query`
**Auth:** None required
**Usage:** Latest research papers, PDF downloads

## Infrastructure

### PostgreSQL
**Purpose:** Primary database
**Connection:** `postgresql+asyncpg://user:pass@localhost:5432/research_pilot`
**ORM:** SQLAlchemy with AsyncSession
**Schema:** Auto-created on server start
**Models:** Projects, plans, tasks, artifacts, papers, references

### Redis
**Purpose:** Task queue, caching, pub/sub
**Connection:** `redis://localhost:6379/0`
**Usage:**
- Task queue coordination
- Pub/sub for real-time updates
- Response caching (limited usage)
- Worker coordination

## Third-Party Libraries

### PDF Processing
- **PyMuPDF (fitz):** PDF text extraction
- **pdfplumber:** Table extraction from PDFs

### Authentication
- **python-jose:** JWT token handling
- **passlib:** Password hashing with bcrypt
- **Google OAuth:** Optional OAuth authentication

### Export
- **Pandoc:** Document export (system dependency)

## API Key Requirements

**Minimum:** At least one LLM provider required
**Recommended:** All LLM providers configured for fallback

```bash
# Required (at least one)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
GROQ_API_KEY=...

# Optional
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Rate Limiting

**Current:** No rate limiting implementation detected
**Risk:** API quota exhaustion on free tiers
**Recommendation:** Implement rate limiting for external API calls

## Error Handling

**Strategy:** Multi-provider fallback
**Behavior:** If one LLM provider fails, system attempts next configured provider
**Issue:** Fallback logic exists but not consistently used

---

*Integrations analysis: 2026-02-11*
