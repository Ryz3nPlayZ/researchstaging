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
    PID=$(lsof -ti :$port || true)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}[$(timestamp)] [SYSTEM] Port $port is in use by PID $PID. Killing it...${NC}"
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
done

# 2. Force kill any rogue vite or node processes related to this project
echo -e "${BLUE}[$(timestamp)] [SYSTEM] Cleaning up any rogue frontend processes...${NC}"
pkill -f "vite" || true

# 4. Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}[$(timestamp)] [SYSTEM] WARNING: backend/.env not found${NC}"
    echo -e "${GREEN}[$(timestamp)] [SYSTEM] Creating from .env.example if available...${NC}"
    cp backend/.env.example backend/.env 2>/dev/null || true
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
$PYTHON_BIN server.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}[$(timestamp)] [BACKEND] Started (PID: $BACKEND_PID, Logs: backend.log)${NC}"

cd ..

# --- START FRONTEND ---
echo -e "${BLUE}[$(timestamp)] [FRONTEND] Starting Frontend Server...${NC}"
cd frontend

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[$(timestamp)] [FRONTEND] Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background (port 3000)
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}[$(timestamp)] [FRONTEND] Started (PID: $FRONTEND_PID, Logs: frontend.log)${NC}"

cd ..

# --- VERIFICATION ---
echo -e "${YELLOW}[$(timestamp)] [SYSTEM] Waiting for services to initialize...${NC}"

# Wait for backend (port 8000)
timeout=30
while ! lsof -i :8000 > /dev/null && [ $timeout -gt 0 ]; do
    sleep 1
    ((timeout--))
done

if [ $timeout -eq 0 ]; then
    echo -e "${RED}[$(timestamp)] [SYSTEM] ERROR: Backend failed to start on port 8000 within 30 seconds.${NC}"
    echo -e "${RED}[$(timestamp)] [SYSTEM] Check backend.log for details.${NC}"
    cleanup
fi
echo -e "${GREEN}[$(timestamp)] [BACKEND] Confirmed listening on port 8000${NC}"

# Wait for frontend (port 3000)
timeout=45
while ! lsof -i :3000 > /dev/null && [ $timeout -gt 0 ]; do
    sleep 1
    ((timeout--))
done

if [ $timeout -eq 0 ]; then
    echo -e "${RED}[$(timestamp)] [SYSTEM] ERROR: Frontend failed to start on port 3000 within 45 seconds.${NC}"
    echo -e "${RED}[$(timestamp)] [SYSTEM] Check frontend.log for details.${NC}"
    ACTUAL_PORT=$(lsof -i -P -n | grep "LISTEN" | grep "node" | awk '{print $9}' | cut -d: -f2 | head -n 1)
    if [ -n "$ACTUAL_PORT" ] && [ "$ACTUAL_PORT" != "3000" ]; then
        echo -e "${YELLOW}[$(timestamp)] [SYSTEM] NOTE: Frontend seems to be listening on port $ACTUAL_PORT instead of 3000.${NC}"
    fi
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
echo ""
echo -e "${YELLOW}[$(timestamp)] [SYSTEM] Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
