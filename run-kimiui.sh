#!/bin/bash
# Start Kimi UI + Backend
# Alternative UI for Research Pilot

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Timestamp function for consistent logging
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

echo -e "${PURPLE}[$(timestamp)] [KIMIUI] ========================================${NC}"
echo -e "${PURPLE}[$(timestamp)] [KIMIUI]   Kimi UI + Backend Startup${NC}"
echo -e "${PURPLE}[$(timestamp)] [KIMIUI] ========================================${NC}"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo -e "${YELLOW}[$(timestamp)] [KIMIUI] Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}[$(timestamp)] [KIMIUI] Done.${NC}"
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# --- PRE-FLIGHT CHECKS ---
echo -e "${BLUE}[$(timestamp)] [KIMIUI] Performing pre-flight checks...${NC}"

# Kill existing processes on ports 8000 and 3456
for port in 8000 3456; do
    PID=$(lsof -ti :$port || true)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}[$(timestamp)] [KIMIUI] Port $port is in use by PID $PID. Killing it...${NC}"
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
done

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}[$(timestamp)] [KIMIUI] WARNING: backend/.env not found${NC}"
    echo -e "${GREEN}[$(timestamp)] [KIMIUI] Creating from .env.example if available...${NC}"
    cp backend/.env.example backend/.env 2>/dev/null || true
fi

# Check if kimiui exists
if [ ! -d "kimiui" ]; then
    echo -e "${RED}[$(timestamp)] [KIMIUI] ERROR: kimiui directory not found!${NC}"
    exit 1
fi

# --- START BACKEND ---
echo -e "${BLUE}[$(timestamp)] [BACKEND] Starting Backend Server...${NC}"
cd backend

# Use the specific python from venv if available
PYTHON_BIN="python"
if [ -f "venv/bin/python" ]; then
    PYTHON_BIN="./venv/bin/python"
    echo -e "${GREEN}[$(timestamp)] [BACKEND] Using virtual environment python.${NC}"
fi

# Check dependencies
if ! $PYTHON_BIN -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}[$(timestamp)] [BACKEND] Installing backend dependencies...${NC}"
    $PYTHON_BIN -m pip install -r requirements.txt
fi

# Start backend in background
$PYTHON_BIN server.py > ../backend-kimiui.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}[$(timestamp)] [BACKEND] Started (PID: $BACKEND_PID, Logs: backend-kimiui.log)${NC}"

cd ..

# --- START KIMI UI ---
echo -e "${BLUE}[$(timestamp)] [KIMIUI] Starting Kimi UI Frontend...${NC}"
cd kimiui

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[$(timestamp)] [KIMIUI] Installing frontend dependencies...${NC}"
    npm install
fi

# Build the app first (optional, can also use dev mode)
echo -e "${GREEN}[$(timestamp)] [KIMIUI] Starting Vite dev server on port 3456...${NC}"
npm run dev > ../kimiui.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}[$(timestamp)] [KIMIUI] Started (PID: $FRONTEND_PID, Logs: kimiui.log)${NC}"

cd ..

# --- VERIFICATION ---
echo -e "${YELLOW}[$(timestamp)] [KIMIUI] Waiting for services to initialize...${NC}"

# Wait for backend (port 8000)
timeout=30
while ! lsof -i :8000 > /dev/null && [ $timeout -gt 0 ]; do
    sleep 1
    ((timeout--))
done

if [ $timeout -eq 0 ]; then
    echo -e "${RED}[$(timestamp)] [KIMIUI] ERROR: Backend failed to start on port 8000 within 30 seconds.${NC}"
    echo -e "${RED}[$(timestamp)] [KIMIUI] Check backend-kimiui.log for details.${NC}"
    cleanup
fi
echo -e "${GREEN}[$(timestamp)] [BACKEND] Confirmed listening on port 8000${NC}"

# Wait for kimiui (port 3456)
timeout=45
while ! lsof -i :3456 > /dev/null && [ $timeout -gt 0 ]; do
    sleep 1
    ((timeout--))
done

if [ $timeout -eq 0 ]; then
    echo -e "${RED}[$(timestamp)] [KIMIUI] ERROR: Frontend failed to start on port 3456 within 45 seconds.${NC}"
    echo -e "${RED}[$(timestamp)] [KIMIUI] Check kimiui.log for details.${NC}"
    cleanup
fi
echo -e "${GREEN}[$(timestamp)] [KIMIUI] Confirmed listening on port 3456${NC}"

echo ""
echo -e "${PURPLE}[$(timestamp)] [KIMIUI] ========================================${NC}"
echo -e "${GREEN}[$(timestamp)] [KIMIUI]   Both servers are running!${NC}"
echo -e "${PURPLE}[$(timestamp)] [KIMIUI] ========================================${NC}"
echo ""
echo -e "${GREEN}[$(timestamp)] [KIMIUI] Backend:  http://localhost:8000${NC}"
echo -e "${GREEN}[$(timestamp)] [KIMIUI] Kimi UI:  http://localhost:3456${NC}"
echo -e "${GREEN}[$(timestamp)] [KIMIUI] API Docs: http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}[$(timestamp)] [KIMIUI] Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
