#!/bin/bash
# Robust startup script for Research Pilot
# Starts both backend and frontend, handling port conflicts, locks, and verification.

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Timestamp function for consistent logging
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}[$(timestamp)] [SYSTEM] ========================================${NC}"
echo -e "${BLUE}[$(timestamp)] [SYSTEM]   Research Pilot - Full Stack Start${NC}"
echo -e "${BLUE}[$(timestamp)] [SYSTEM] ========================================${NC}"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo -e "${YELLOW}[$(timestamp)] [SYSTEM] Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}[$(timestamp)] [SYSTEM] Done.${NC}"
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# --- PRE-FLIGHT CHECKS ---
echo -e "${BLUE}[$(timestamp)] [SYSTEM] Performing pre-flight checks...${NC}"

# 1. Kill existing processes on ports 8000 and 3000
for port in 8000 3000; do
    PID=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}[$(timestamp)] [SYSTEM] Port $port in use by PID $PID. Killing...${NC}"
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
done

# 2. Force kill any rogue Next.js / vite processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# 3. Check backend .env
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo -e "${YELLOW}[$(timestamp)] [SYSTEM] WARNING: backend/.env not found${NC}"
    if [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
        cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
        echo -e "${GREEN}[$(timestamp)] [SYSTEM] Copied .env.example → backend/.env — fill in your secrets before going live.${NC}"
    fi
fi

# 4. Warn if frontend .env.local is missing (not fatal — uses defaults)
if [ ! -f "$SCRIPT_DIR/frontend/.env.local" ]; then
    echo -e "${YELLOW}[$(timestamp)] [SYSTEM] TIP: frontend/.env.local not found.${NC}"
    echo -e "${YELLOW}[$(timestamp)] [SYSTEM]      Create it with NEXT_PUBLIC_DEV_AUTH=true for local mock login.${NC}"
fi

# 5. Check Redis
if command -v redis-cli >/dev/null 2>&1; then
    if ! redis-cli ping >/dev/null 2>&1; then
        echo -e "${YELLOW}[$(timestamp)] [SYSTEM] WARNING: Redis is not running. Real-time updates via WebSocket will not work.${NC}"
        echo -e "${YELLOW}[$(timestamp)] [SYSTEM]          Start Redis: redis-server  OR  docker-compose up -d redis${NC}"
    else
        echo -e "${GREEN}[$(timestamp)] [SYSTEM] Redis: OK${NC}"
    fi
else
    echo -e "${YELLOW}[$(timestamp)] [SYSTEM] TIP: redis-cli not found — install Redis for WebSocket support.${NC}"
fi

# --- RESOLVE PYTHON ---
# Prefer: root .venv → backend/venv → system python
PYTHON_BIN="python"
if [ -f "$SCRIPT_DIR/.venv/bin/python" ]; then
    PYTHON_BIN="$SCRIPT_DIR/.venv/bin/python"
    echo -e "${GREEN}[$(timestamp)] [BACKEND] Using root .venv Python.${NC}"
elif [ -f "$SCRIPT_DIR/backend/venv/bin/python" ]; then
    PYTHON_BIN="$SCRIPT_DIR/backend/venv/bin/python"
    echo -e "${GREEN}[$(timestamp)] [BACKEND] Using backend/venv Python.${NC}"
else
    echo -e "${YELLOW}[$(timestamp)] [BACKEND] No venv found — using system Python.${NC}"
fi

# --- START BACKEND ---
echo -e "${BLUE}[$(timestamp)] [BACKEND] Starting Backend Server...${NC}"
cd "$SCRIPT_DIR/backend"

# Install / sync Python deps if anything is missing
if ! $PYTHON_BIN -c "import fastapi, alembic, sentry_sdk" 2>/dev/null; then
    echo -e "${YELLOW}[$(timestamp)] [BACKEND] Installing backend dependencies...${NC}"
    $PYTHON_BIN -m pip install -r requirements.txt --quiet
fi

# Run Alembic migrations (development only — production uses railway.toml start command)
ENVIRONMENT="${ENVIRONMENT:-development}"
if [ "$ENVIRONMENT" = "development" ]; then
    if $PYTHON_BIN -c "import alembic" 2>/dev/null; then
        echo -e "${BLUE}[$(timestamp)] [BACKEND] Running database migrations (alembic upgrade head)...${NC}"
        $PYTHON_BIN -m alembic upgrade head 2>&1 || \
            echo -e "${YELLOW}[$(timestamp)] [BACKEND] Migration skipped (DB may not be running yet — that's OK for first boot).${NC}"
    fi
fi

# Start backend in background
$PYTHON_BIN server.py > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}[$(timestamp)] [BACKEND] Started (PID: $BACKEND_PID, Logs: backend.log)${NC}"

cd "$SCRIPT_DIR"

# --- START FRONTEND ---
echo -e "${BLUE}[$(timestamp)] [FRONTEND] Starting Frontend Server...${NC}"
cd "$SCRIPT_DIR/frontend"

# Install npm deps if node_modules is missing OR package.json is newer
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
    echo -e "${YELLOW}[$(timestamp)] [FRONTEND] Installing frontend dependencies (npm install)...${NC}"
    npm install --legacy-peer-deps
fi

# Start frontend in background (port 3000)
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}[$(timestamp)] [FRONTEND] Started (PID: $FRONTEND_PID, Logs: frontend.log)${NC}"

cd "$SCRIPT_DIR"

# --- VERIFICATION ---
echo -e "${YELLOW}[$(timestamp)] [SYSTEM] Waiting for services to initialize...${NC}"

# Helper: check if a port is listening
port_listening() {
    local port=$1
    if command -v ss >/dev/null 2>&1; then
        ss -tlnp 2>/dev/null | grep -q ":$port "
    elif command -v lsof >/dev/null 2>&1; then
        lsof -i :$port >/dev/null 2>&1
    else
        netstat -tlnp 2>/dev/null | grep -q ":$port "
    fi
}

# Wait for backend (port 8000)
timeout=30
while ! port_listening 8000 && [ $timeout -gt 0 ]; do
    sleep 1
    ((timeout--))
done

if [ $timeout -eq 0 ]; then
    echo -e "${RED}[$(timestamp)] [SYSTEM] ERROR: Backend failed to start on port 8000 within 30s.${NC}"
    echo -e "${RED}[$(timestamp)] [SYSTEM] Check backend.log for details.${NC}"
    cleanup
fi
echo -e "${GREEN}[$(timestamp)] [BACKEND] Confirmed listening on port 8000${NC}"

# Wait for frontend (port 3000)
timeout=60
while ! port_listening 3000 && [ $timeout -gt 0 ]; do
    sleep 1
    ((timeout--))
done

if [ $timeout -eq 0 ]; then
    echo -e "${RED}[$(timestamp)] [SYSTEM] ERROR: Frontend failed to start on port 3000 within 60s.${NC}"
    echo -e "${RED}[$(timestamp)] [SYSTEM] Check frontend.log for details.${NC}"
    cleanup
fi
echo -e "${GREEN}[$(timestamp)] [FRONTEND] Confirmed listening on port 3000${NC}"

echo ""
echo -e "${BLUE}[$(timestamp)] [SYSTEM] ========================================${NC}"
echo -e "${GREEN}[$(timestamp)] [SYSTEM]   Both servers are running!${NC}"
echo -e "${BLUE}[$(timestamp)] [SYSTEM] ========================================${NC}"
echo ""
echo -e "${GREEN}[$(timestamp)] [SYSTEM] Backend:  http://localhost:8000${NC}"
echo -e "${GREEN}[$(timestamp)] [SYSTEM] Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}[$(timestamp)] [SYSTEM] API Docs: http://localhost:8000/docs${NC}"
echo -e "${GREEN}[$(timestamp)] [SYSTEM] Admin:    http://localhost:3000/admin (admins only)${NC}"
echo ""
echo -e "${YELLOW}[$(timestamp)] [SYSTEM] Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
