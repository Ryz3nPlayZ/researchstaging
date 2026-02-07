#!/bin/bash
# Start the frontend development server

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp function for consistent logging
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

echo -e "${BLUE}[$(timestamp)] [FRONTEND] Starting Research Pilot Frontend...${NC}"

# Change to frontend directory
cd frontend3

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}[$(timestamp)] [FRONTEND] Installing dependencies...${NC}"
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${GREEN}[$(timestamp)] [FRONTEND] Creating .env file...${NC}"
    echo "VITE_API_URL=http://localhost:8000" > .env
fi

# Start the dev server
echo -e "${GREEN}[$(timestamp)] [FRONTEND] Starting on http://localhost:3000${NC}"
echo ""

npm run dev
