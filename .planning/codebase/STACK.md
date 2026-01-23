# Technology Stack

**Analysis Date:** 2025-01-23

## Languages

**Primary:**
- Python 3.14.2 - Backend API, services, orchestration engine
- JavaScript/JSX - Frontend React application

**Secondary:**
- SQL - Database queries (via SQLAlchemy ORM)
- CSS - Styling (via Tailwind CSS)

## Runtime

**Environment:**
- Node.js v20.20.0 - Frontend development and build
- Python 3.14.2 - Backend runtime

**Package Manager:**
- Yarn 1.22.22 - Frontend dependencies
- pip/pip-tools - Backend Python dependencies
- Lockfile: `yarn.lock` (frontend), requirements.txt (backend)

## Frameworks

**Core:**
- FastAPI 0.110.1 - Async Python web framework for REST API
- React 19.0.0 - Frontend UI framework
- SQLAlchemy 2.x - Async ORM for PostgreSQL
- Starlette 0.37.2 - ASGI framework (FastAPI dependency)

**Testing:**
- pytest 9.0.2 - Python test runner
- react-scripts 5.0.1 - React testing utilities

**Build/Dev:**
- Craco 7.1.0 - React App configuration override
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- PostCSS 8.4.49 - CSS processing
- Vite/CRACO - Frontend build tooling

## Key Dependencies

**Critical:**
- uvicorn 0.25.0 - ASGI server for FastAPI
- pydantic 2.12.5 - Data validation and settings
- httpx 0.28.1 - Async HTTP client
- websockets 15.0.1 - WebSocket support
- motor 3.3.1 - Async MongoDB driver (present but not actively used)

**Infrastructure:**
- redis.asyncio - Async Redis client for pub/sub
- asyncpg - Async PostgreSQL driver
- boto3 1.42.29 - AWS SDK (included but usage unclear)
- s3transfer 0.16.0 - S3 transfer utilities

**AI/ML:**
- openai 1.99.9 - OpenAI API client (direct integration available)
- google-generativeai 0.8.6 - Google Gemini API client
- litellm 1.80.0 - Unified LLM API provider
- tiktoken 0.12.0 - OpenAI tokenization
- emergentintegrations 0.1.0 - Custom LLM integration package

**Document Processing:**
- PyMuPDF 1.26.7 (fitz) - PDF text extraction
- pdfplumber 0.11.9 - PDF parsing with table support
- pdfminer.six 20251230 - PDF parsing fallback
- pypandoc 1.16.2 - Pandoc wrapper for document conversion

**Frontend Libraries:**
- axios 1.8.4 - HTTP client
- react-router-dom 7.5.1 - Client-side routing
- react-hook-form 7.56.2 - Form handling
- @tiptap/react 3.17.0 - Rich text editor
- reactflow 11.11.4 - Flow chart/graph visualization
- recharts 3.6.0 - Charting library
- @radix-ui/* - Headless UI component library
- lucide-react 0.507.0 - Icon library

## Configuration

**Environment:**
- python-dotenv 1.2.1 - Environment variable loading from .env files
- .env files in backend directory for secrets

**Build:**
- craco.config.js - React app customization
- tailwind.config.js - Tailwind CSS configuration
- postcss.config.js - PostCSS plugins configuration
- jsconfig.json - JavaScript path aliases

**Linting/Formatting:**
- black 25.12.0 - Python code formatter
- flake8 7.3.0 - Python linter
- isort 7.0.0 - Python import sorting
- mypy 1.19.1 - Python type checker
- eslint 9.23.0 - JavaScript linter
- autoprefixer 10.4.20 - CSS vendor prefixing

## Platform Requirements

**Development:**
- Python 3.14+ with async/await support
- Node.js 20+ and Yarn 1.22+
- PostgreSQL 15+ with asyncpg support
- Redis 7+ for pub/sub messaging
- Pandoc installation for document export functionality

**Production:**
- Linux-compatible environment
- ASGI-capable server (uvicorn recommended)
- PostgreSQL database with JSONB support
- Redis for real-time messaging
- Sufficient disk space for temporary PDF storage

---

*Stack analysis: 2025-01-23*
