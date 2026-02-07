#!/bin/bash
# Start both backend and frontend servers

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
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}[$(timestamp)] [SYSTEM] Done.${NC}"
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}[$(timestamp)] [SYSTEM] WARNING: backend/.env not found${NC}"
    echo -e "${GREEN}[$(timestamp)] [SYSTEM] Creating from .env.example if available...${NC}"
    cp backend/.env.example backend/.env 2>/dev/null || true
fi

# Start backend
echo -e "${BLUE}[$(timestamp)] [BACKEND] Starting Backend Server...${NC}"
cd backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check dependencies
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}[$(timestamp)] [BACKEND] Installing backend dependencies...${NC}"
    pip install -r requirements.txt
fi

# Start backend in background
python server.py &
BACKEND_PID=$!
echo -e "${GREEN}[$(timestamp)] [BACKEND] Started (PID: $BACKEND_PID)${NC}"

cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo -e "${BLUE}[$(timestamp)] [FRONTEND] Starting Frontend Server...${NC}"
cd frontend3

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[$(timestamp)] [FRONTEND] Installing frontend dependencies...${NC}"
    npm install
fi

# Check .env
if [ ! -f ".env" ]; then
    echo "VITE_API_URL=http://localhost:8000" > .env
fi

# Start frontend in background
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}[$(timestamp)] [FRONTEND] Started (PID: $FRONTEND_PID)${NC}"

cd ..

# Wait for frontend to start and confirm port
sleep 3
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

# Wait for either process
wait $BACKEND_PID $FRONTEND_PID
