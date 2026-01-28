# Technology Stack

**Analysis Date:** 2025-01-27

## Languages

**Primary:**
- TypeScript 4.9.5 - Frontend (frontend-v2)
- Python 3.14.2 - Backend

**Secondary:**
- JavaScript - Build scripts and legacy frontend (frontend)
- SQL - PostgreSQL queries (via SQLAlchemy ORM)

## Runtime

**Environment:**
- Node.js v20.20.0 - Frontend runtime
- Python 3.14.2 - Backend runtime

**Package Manager:**
- npm 11.7.0 - Frontend dependencies
- pip - Python dependencies (via requirements.txt)
- Lockfile: `package-lock.json` present for frontend-v2, no pip lock detected

## Frameworks

**Core:**
- React 19.2.3 - Frontend UI framework
- FastAPI 0.110.0-0.120.0 - Backend REST API
- React Router DOM 7.13.0 - Frontend routing

**State Management:**
- Zustand 5.0.10 - Client-side state management
- TanStack React Query 5.90.20 - Server state management
- Redis 7-alpine - Backend caching/pub-sub

**Testing:**
- React Testing Library 16.3.2 - Frontend component testing
- Jest DOM 6.9.1 - Jest matchers for React
- Pytest 7.4.0-9.0.0 - Backend testing
- pytest-asyncio 0.21.0-1.0.0 - Async test support

**Build/Dev:**
- React Scripts 5.0.1 - Frontend build tooling
- Tailwind CSS 3.4.19 - Utility-first CSS framework
- Autoprefixer 10.4.23 - CSS vendor prefixing
- PostCSS 8.5.6 - CSS transformation

## Key Dependencies

**Critical:**
- @tiptap/react 3.17.1 - Rich text editor for document creation
- ReactFlow 11.11.4 - Interactive graph visualization for task/agent flows
- Lucide React 0.563.0 - Icon library
- Pydantic 2.0.0-3.0.0 - Data validation and settings management

**Infrastructure:**
- SQLAlchemy 2.0.0-3.0.0 - Python ORM for PostgreSQL
- asyncpg 0.29.0-0.31.0 - Async PostgreSQL driver
- psycopg2-binary 2.9.0-3.0.0 - PostgreSQL adapter
- redis[hiredis] 5.0.0-6.0.0 - Redis client with C parser
- httpx 0.27.0-0.29.0 - Async HTTP client
- aiohttp 3.9.0-4.0.0 - Async HTTP client/server
- websockets 12.0.0-16.0.0 - WebSocket support

**PDF Processing:**
- PyMuPDF 1.23.0-2.0.0 - Fast PDF text extraction
- pdfplumber 0.10.0-0.12.0 - Table extraction from PDFs
- pdfminer.six 20231228-20241001 - PDF parsing fallback
- pypandoc 1.12.0-2.0.0 - Document conversion

**Authentication:**
- python-jose[cryptography] 3.3.0-4.0.0 - JWT token handling
- passlib[bcrypt] 1.7.4-2.0.0 - Password hashing

**Data Processing:**
- pandas 2.0.0-3.0.0 - Data manipulation
- numpy 1.24.0-3.0.0 - Numerical computing

## Configuration

**Environment:**
- python-dotenv 1.0.0-2.0.0 - Load environment variables from .env files
- Backend `.env` location: `/home/zemul/Programming/research/backend/.env`
- Frontend uses `REACT_APP_API_URL` environment variable (defaults to `http://localhost:8000/api`)
- No `.env` file detected for frontend-v2 (uses defaults)

**Build:**
- `tsconfig.json` - TypeScript configuration with strict mode enabled
- `tailwind.config.js` - Tailwind CSS customization with design tokens
- `postcss.config.js` - PostCSS plugins (Tailwind + Autoprefixer)

## Platform Requirements

**Development:**
- Node.js 20.20.0 or higher
- Python 3.14.2
- PostgreSQL 15 (via Docker or local)
- Redis 7 (via Docker or local)

**Production:**
- Backend deployed as ASGI application (Uvicorn)
- Frontend built to static files (React build)
- PostgreSQL database required
- Redis required for WebSocket pub/sub and caching

---

*Stack analysis: 2025-01-27*
