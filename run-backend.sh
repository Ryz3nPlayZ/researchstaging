#!/bin/bash
# Start the backend server

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Research Pilot Backend...${NC}"

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${GREEN}Creating .env file from example...${NC}"
    cp backend/.env.example backend/.env 2>/dev/null || echo "WARNING: .env.example not found"
fi

# Change to backend directory
cd backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo -e "${GREEN}Activating virtual environment...${NC}"
    source venv/bin/activate
fi

# Check if required packages are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${GREEN}Installing dependencies...${NC}"
    pip install -r requirements.txt
fi

# Start the server
echo -e "${GREEN}Backend server starting on http://localhost:8000${NC}"
echo -e "${GREEN}API docs: http://localhost:8000/docs${NC}"
echo ""

python server.py
