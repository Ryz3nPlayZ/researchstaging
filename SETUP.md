# Local Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Python 3.14+**
   ```bash
   python --version  # Should be 3.14.x
   ```

2. **Node.js 20+ and Yarn 1.22+**
   ```bash
   node --version   # Should be 20.x
   yarn --version   # Should be 1.22.x
   ```

3. **PostgreSQL 15+**
   ```bash
   psql --version
   ```

4. **Redis 7+**
   ```bash
   redis-server --version
   ```

5. **Pandoc** (for document export)
   ```bash
   pandoc --version
   ```

### Installation Commands

**Ubuntu/Debian:**
```bash
# Python 3.14 (may need pyenv or deadsnakes PPA)
sudo apt update
sudo apt install python3.14 python3.14-venv python3-pip

# Node.js 20 (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Yarn
npm install -g yarn

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server

# Pandoc
sudo apt install pandoc
```

**macOS:**
```bash
# Using Homebrew
brew install python@3.14 node yarn postgresql redis pandoc
```

---

## 1. Database Setup

### Create PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql, run:
CREATE DATABASE research_pilot;
CREATE USER research_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE research_pilot TO research_user;
\q
```

---

## 2. Redis Setup

### Start Redis Server

```bash
# Linux
sudo systemctl start redis-server
sudo systemctl enable redis-server

# macOS
brew services start redis

# Or run directly
redis-server
```

Test Redis:
```bash
redis-cli ping  # Should return "PONG"
```

---

## 3. Backend Setup

```bash
cd /home/zemul/Programming/research/research/backend

# Create virtual environment
python3.14 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Configuration

Create a `.env` file in the `research/backend/` directory:

```bash
cd /home/zemul/Programming/research/research/backend
nano .env  # or use your preferred editor
```

Add the following content:

```env
# Database
DATABASE_URL=postgresql+asyncpg://research_user:your_secure_password@localhost:5432/research_pilot

# Redis
REDIS_URL=redis://localhost:6379/0

# LLM API Key (REQUIRED)
EMERGENT_LLM_KEY=your_llm_api_key_here

# CORS (for development)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Get LLM API Key

You need an API key for the Emergent Integrations LLM service:
- Sign up at the service provider
- Copy your API key
- Paste it in the `.env` file as `EMERGENT_LLM_KEY`

---

## 4. Frontend Setup

```bash
cd /home/zemul/Programming/research/research/frontend

# Install dependencies
yarn install
```

---

## 5. Run Database Migrations

The project uses SQLAlchemy ORM with automatic schema creation. The database tables will be created automatically when you first start the backend server.

To verify tables were created:
```bash
sudo -u postgres psql research_pilot

\dt  # List all tables
# You should see: projects, plans, tasks, task_dependencies, task_runs, artifacts, papers, references, execution_logs
\q
```

---

## 6. Start the Application

### Terminal 1: Backend Server

```bash
cd /home/zemul/Programming/research/research/backend
source venv/bin/activate
python server.py
```

You should see output like:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2: Frontend Development Server

```bash
cd /home/zemul/Programming/research/research/frontend
yarn start
```

The frontend should open automatically at:
- **http://localhost:3000**

---

## 7. Testing the Application

### 1. Open the Application

Navigate to http://localhost:3000 in your browser.

### 2. Create Your First Research Project

1. Click "New Project" or similar button
2. Enter a research goal, for example:
   - **Research Goal**: "Impact of climate change on coastal biodiversity"
   - **Output Type**: Literature Review
   - **Audience**: Academic

3. Click "Generate Plan" or similar

### 3. Review and Execute

1. Review the generated research plan
2. Click "Approve" or "Execute" to start the research pipeline
3. Watch the tasks execute in real-time via the status bar

### 4. Monitor Progress

- The workspace view shows:
  - Task status (pending, running, completed, failed)
  - Artifacts as they're produced
  - Papers found and processed
  - Generated drafts

### 5. View Results

Once tasks complete:
- Navigate to the Documents view
- Open generated literature reviews or drafts
- Inspect provenance (click on sections to see what produced them)

---

## Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U research_user -d research_pilot -h localhost
```

**Redis Connection Error:**
```bash
# Check Redis is running
redis-cli ping

# If not running, start it:
sudo systemctl start redis-server
```

**LLM API Key Error:**
```bash
# Verify .env file exists and has the key
cd /home/zemul/Programming/research/research/backend
cat .env | grep EMERGENT_LLM_KEY
```

### Frontend Issues

**Port Already in Use:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port:
yarn start --port 3001
```

**CORS Errors:**
- Ensure backend `.env` has `CORS_ORIGINS=http://localhost:3000`
- Restart backend server after changing `.env`

### Task Execution Issues

**Tasks stuck in RUNNING state:**
- Check backend logs for errors
- Verify Redis is running
- Check database connection

**PDF processing failures:**
- Ensure Pandoc is installed: `pandoc --version`
- Check `/tmp/research_pilot_pdfs` directory permissions

---

## Development Tips

### View Backend Logs

Backend logs are printed to console. Key log levels:
- `INFO`: Normal operations
- `WARNING`: Non-critical issues
- `ERROR`: Failures requiring attention

### View Frontend Logs

Open browser DevTools (F12) and check Console tab.

### Database Inspection

```bash
# Connect to database
sudo -u postgres psql research_pilot

# Useful queries
SELECT * FROM projects ORDER BY created_at DESC LIMIT 5;
SELECT * FROM tasks WHERE project_id = 'your-project-id';
SELECT * FROM artifacts WHERE project_id = 'your-project-id';

\q  # Quit
```

### Reset Database (⚠️ Deletes all data)

```bash
sudo -u postgres psql
DROP DATABASE research_pilot;
CREATE DATABASE research_pilot;
GRANT ALL PRIVILEGES ON DATABASE research_pilot TO research_user;
\q
```

Then restart backend server (tables will auto-create).

---

## Architecture Overview

### Backend Flow
1. User submits research goal via frontend
2. Backend creates Project and Plan records
3. Orchestration engine expands Plan into Task DAG
4. Worker executes tasks (literature search, PDF processing, synthesis)
5. Artifacts stored in database, progress via WebSocket

### Key Components
- **API Layer**: `server.py` - FastAPI endpoints
- **Orchestration**: `orchestration/engine.py` - Task DAG management
- **Workers**: `workers/task_worker.py` - Task execution
- **Services**: `llm_service.py`, `literature_service.py`, `pdf_service.py` - External integrations
- **Database**: `database/models.py` - SQLAlchemy models
- **Real-time**: `realtime/websocket.py` - WebSocket updates

---

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/api/
```

### List Projects
```bash
curl http://localhost:8000/api/projects
```

### Create Project
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "research_goal": "Impact of climate change on coastal biodiversity",
    "output_type": "literature_review",
    "audience": "academic"
  }'
```

### Get Project Details
```bash
curl http://localhost:8000/api/projects/{project_id}
```

---

## Next Steps

Once everything is running:

1. **Test with simple research goals first**
2. **Monitor task execution** in the workspace view
3. **Inspect artifacts** as they're produced
4. **Review generated drafts** for quality
5. **Check provenance** by clicking on document sections

---

## Support

For issues or questions:
- Check logs in both backend and frontend terminals
- Review database state via psql
- Ensure all prerequisites are correctly installed
- Verify `.env` configuration

---

**Happy researching!** 🚀
