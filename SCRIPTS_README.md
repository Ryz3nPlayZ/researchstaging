# Research Pilot - Quick Start Scripts

This directory contains convenient shell scripts for running Research Pilot.

## Prerequisites

- **Python 3.14+**
- **Node.js 18+**
- **PostgreSQL 14+** (or use Docker)
- **Redis** (or use Docker)

## Quick Start (First Time)

### Option 1: Automated Setup

```bash
# 1. Run setup (installs dependencies, creates .env files)
./setup.sh

# 2. Start Docker services (PostgreSQL + Redis)
./docker-start.sh

# 3. Add your API keys to backend/.env
#    - OPENAI_API_KEY or GEMINI_API_KEY
#    - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (for OAuth)

# 4. Run database migrations
python backend/scripts/migrate_add_credits.py

# 5. Start the application
./run-all.sh
```

### Option 2: Manual Setup

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit .env with your keys

# Frontend
cd research-ui
npm install
echo "VITE_API_URL=http://localhost:8000" > .env

# Database (make sure PostgreSQL is running)
python backend/scripts/migrate_add_credits.py
```

## Available Scripts

### `./setup.sh`
Initial setup for the entire project.

- Checks Python, Node.js, PostgreSQL, Redis
- Creates Python virtual environment
- Installs all dependencies
- Creates .env files
- Prompts to run migrations

### `./docker-start.sh`
Start PostgreSQL and Redis using Docker.

**Prerequisites:** Docker installed

```bash
./docker-start.sh          # Start services
docker-compose down         # Stop services
```

### `./run-all.sh`
Start both backend and frontend servers simultaneously.

- Backend on http://localhost:8000
- Frontend on http://localhost:3000
- Press `Ctrl+C` to stop both

### `./run-backend.sh`
Start only the backend server.

```bash
./run-backend.sh
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### `./run-frontend.sh`
Start only the frontend development server.

```bash
./run-frontend.sh
# Frontend: http://localhost:3000
```

## Environment Variables

### Backend (`backend/.env`)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/research_pilot

# Redis
REDIS_URL=redis://localhost:6379/0

# LLM Providers (at least one required)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...

# Google OAuth (optional, for authentication)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

# JWT Secret
JWT_SECRET_KEY=change-this-to-a-random-secret-key

# CORS
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:8000
```

## Database Migrations

Run credit system migration:

```bash
python backend/scripts/migrate_add_credits.py
```

## Troubleshooting

### PostgreSQL Connection Error

Make sure PostgreSQL is running:

```bash
# Check if PostgreSQL is running
pg_isready

# Or use Docker
./docker-start.sh
```

### Redis Connection Error

Make sure Redis is running:

```bash
# Check if Redis is running
redis-cli ping

# Or use Docker
./docker-start.sh
```

### Port Already in Use

If port 8000 or 5173 is already in use:

```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

### Virtual Environment Issues

Recreate the virtual environment:

```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Development Workflow

### Start Development

```bash
# Terminal 1: Start infrastructure
./docker-start.sh

# Terminal 2: Start application
./run-all.sh
```

### View Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Stop Everything

```bash
# Press Ctrl+C in the terminal where run-all.sh is running
./docker-start.sh down  # Stop Docker services
```

## Production Deployment

For production, you'll need to:

1. Set up a production database (Managed PostgreSQL)
2. Use a production Redis instance
3. Configure environment variables for production
4. Build frontend: `cd frontend && npm run build`
5. Use a production WSGI server (Gunicorn) for backend
6. Set up SSL/TLS certificates
7. Configure Stripe for payments

See [DEPLOYMENT.md](./DEPLOYMENT.md) for details (TODO).
