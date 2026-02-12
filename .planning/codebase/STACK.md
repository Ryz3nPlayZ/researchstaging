# Tech Stack

**Analysis Date:** 2026-02-11

## Backend

**Language:** Python 3.14+
**Framework:** FastAPI 0.110.0-0.120.0
**ORM:** SQLAlchemy 2.0.0-3.0.0 (AsyncSession, asyncpg driver)
**Database:** PostgreSQL
**Task Queue:** Redis 5.0.0-6.0.0
**Caching:** Redis (also used for task queue)

### Backend Dependencies
```python
# Core
fastapi==0.110.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
asyncpg==0.29.0
redis==5.0.1

# LLM Providers
openai>=1.0.0
google-generativeai>=0.3.0
mistralai>=0.1.0
groq>=0.1.0

# Utilities
pydantic==2.6.0
pydantic-settings==2.1.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

## Frontend

**Framework:** React 19 with TypeScript support (currently JS)
**UI Library:** Radix UI components (Shadcn UI)
**Styling:** Tailwind CSS
**State Management:** React Context API
**Build Tool:** Vite (frontend3), legacy webpack (frontend)

### Frontend Dependencies
```json
{
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "@radix-ui/react-*": "latest",
  "tailwindcss": "^3.4.0",
  "react-router-dom": "^6.20.0",
  "zustand": "^4.4.0"
}
```

## TUI (Terminal UI)

**Framework:** Textual (Python)
**Location:** `research_tui/` directory
**Package:** Separate from main web UI

## External Services

### LLM Providers
- OpenAI (GPT-4, GPT-3.5)
- Google Gemini
- Mistral AI
- Groq

### Academic APIs
- Semantic Scholar (literature search)
- arXiv (preprint papers)

### Infrastructure
- PostgreSQL (primary database)
- Redis (task queue, caching, pub/sub)

## Key Libraries

### Backend
- `llm_service.py`: Multi-provider LLM abstraction
- `literature_service.py`: Academic paper discovery
- `pdf_service.py`: PDF parsing (PyMuPDF, pdfplumber)
- `reference_service.py`: Citation extraction

### Frontend
- TipTap: Rich text editor
- React Flow: Task DAG visualization
- Radix UI: Component primitives

## Versions

**Python:** 3.14+
**Node.js:** 18+ (inferred from Vite 5.x requirements)
**PostgreSQL:** 14+ (asyncpg requires modern PostgreSQL)

## Development Tools

**Backend:** Black, Flake8, MyPy, pytest
**Frontend:** ESLint, TypeScript compiler

---

*Tech stack analysis: 2026-02-11*
