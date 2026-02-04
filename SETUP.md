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
cd /home/zemul/Programming/research/backend

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
cd /home/zemul/Programming/research/backend
nano .env  # or use your preferred editor
```

Add the following content:

```env
# Database
DATABASE_URL=postgresql+asyncpg://research_user:your_secure_password@localhost:5432/research_pilot

# Redis
REDIS_URL=redis://localhost:6379/0

# File Storage (choose one backend)
# Option 1: Local storage (default - no additional configuration needed)
STORAGE_BACKEND=local
UPLOAD_DIR=uploads

# Option 2: AWS S3
# STORAGE_BACKEND=s3
# S3_BUCKET_NAME=your-bucket-name
# S3_REGION=us-east-1
# S3_ACCESS_KEY_ID=your-aws-access-key-id
# S3_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Option 3: Cloudflare R2 (recommended - zero egress fees)
# STORAGE_BACKEND=r2
# S3_BUCKET_NAME=your-bucket-name
# S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
# S3_ACCESS_KEY_ID=your-r2-access-key-id
# S3_SECRET_ACCESS_KEY=your-r2-secret-access-key

# LLM API Keys (REQUIRED - add at least one)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# CORS (for development)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### File Storage Options

The system supports three storage backends for uploaded files:

#### Local Storage (Default)
Files are stored on the server's disk in the `uploads/` directory. This is the simplest option and requires no additional configuration.

**Pros:** No setup required, works offline
**Cons:** Disk space limited to server capacity, no redundancy

#### AWS S3
Files are stored in Amazon S3 buckets.

**Pros:** Highly reliable, scalable, integrates with AWS ecosystem
**Cons:** Egress fees for downloads, requires AWS account

**Setup:**
1. Create an AWS account if you don't have one
2. Create an S3 bucket (e.g., `research-workspace-files`)
3. Create an IAM user with S3 permissions
4. Generate access keys for the IAM user
5. Configure environment variables (see above)

#### Cloudflare R2 (Recommended)
Files are stored in Cloudflare R2 with zero egress fees.

**Pros:** Zero egress fees (perfect for research datasets), S3-compatible API, lower cost
**Cons:** Requires Cloudflare account

**Setup:**
1. Create a Cloudflare account at https://dash.cloudflare.com/
2. Navigate to R2 overview and enable R2
3. Create a bucket (e.g., `research-workspace-files`)
4. Create an R2 API token:
   - Go to "Manage R2 API Tokens"
   - Click "Create API Token"
   - Give it a name and permissions to edit the bucket
   - Copy the Access Key ID and Secret Access Key
5. Find your Account ID in the Cloudflare dashboard URL
6. Configure environment variables (see above)

Example R2 configuration:
```bash
STORAGE_BACKEND=r2
S3_BUCKET_NAME=research-workspace-files
S3_ENDPOINT_URL=https://abc123def456.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your_r2_token_access_key
S3_SECRET_ACCESS_KEY=your_r2_token_secret
```

### Get LLM API Keys

You need API keys for the LLM providers. Add at least one:

**OpenAI (GPT models):**
- Sign up at https://platform.openai.com/
- Get your API key
- Add as `OPENAI_API_KEY`

**Google (Gemini models):**
- Sign up at https://aistudio.google.com/
- Get your API key
- Add as `GEMINI_API_KEY`

**Mistral AI:**
- Sign up at https://console.mistral.ai/
- Get your API key
- Add as `MISTRAL_API_KEY`

**Groq (fast inference):**
- Sign up at https://console.groq.com/
- Get your API key
- Add as `GROQ_API_KEY`

---

## 4. Frontend Setup

```bash
cd /home/zemul/Programming/research/frontend

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
cd /home/zemul/Programming/research/backend
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
cd /home/zemul/Programming/research/frontend
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
# Verify .env file exists and has at least one key
cd /home/zemul/Programming/research/backend
cat .env | grep -E "OPENAI_API_KEY|GEMINI_API_KEY|MISTRAL_API_KEY|GROQ_API_KEY"
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

## Migrating Files to Cloud Storage

If you started with local storage and want to migrate to S3 or R2:

### Prerequisites
1. Configure S3 or R2 environment variables in `.env`
2. Ensure backend is stopped
3. Run the migration script

### Run Migration

**Test migration (dry run):**
```bash
cd backend
source venv/bin/activate
python scripts/migrate_to_cloud.py --dry-run
```

**Perform migration:**
```bash
python scripts/migrate_to_cloud.py
```

**Migrate specific project only:**
```bash
python scripts/migrate_to_cloud.py --project-id <project-id>
```

### What the Script Does
1. Reads all File records from the database
2. Uploads each file to cloud storage
3. Verifies successful upload
4. Deletes local file after verification
5. Reports statistics (files migrated, failed, skipped)

### After Migration
1. Update `STORAGE_BACKEND` in `.env` to `s3` or `r2`
2. Restart backend server
3. Test file uploads and downloads
4. Keep the `uploads/` directory as backup until you verify everything works

### Rollback (if needed)
If you need to rollback to local storage:
1. Stop backend
2. Restore files from backup
3. Change `STORAGE_BACKEND=local` in `.env`
4. Restart backend

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
