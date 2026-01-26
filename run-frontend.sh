#!/bin/bash
# Start the frontend development server

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Research Pilot Frontend...${NC}"

# Change to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}Installing dependencies...${NC}"
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${GREEN}Creating .env file...${NC}"
    echo "REACT_APP_API_URL=http://localhost:8000" > .env
fi

# Start the dev server
echo -e "${GREEN}Frontend starting on http://localhost:3000${NC}"
echo ""

npm start
