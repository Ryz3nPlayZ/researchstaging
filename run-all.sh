#!/bin/bash
# Start both backend and frontend servers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Research Pilot - Full Stack Start${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Done.${NC}"
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}WARNING: backend/.env not found${NC}"
    echo -e "${GREEN}Creating from .env.example if available...${NC}"
    cp backend/.env.example backend/.env 2>/dev/null || true
fi

# Start backend
echo -e "${BLUE}[1/2] Starting Backend Server...${NC}"
cd backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check dependencies
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    pip install -r requirements.txt
fi

# Start backend in background
python server.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo -e "${BLUE}[2/2] Starting Frontend Server...${NC}"
cd frontend

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Check .env
if [ ! -f ".env" ]; then
    echo "REACT_APP_API_URL=http://localhost:8000" > .env
fi

# Start frontend in background
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

cd ..

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Both servers are running!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Backend:${NC}  http://localhost:8000"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "${GREEN}API Docs:${NC} http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for either process
wait $BACKEND_PID $FRONTEND_PID
