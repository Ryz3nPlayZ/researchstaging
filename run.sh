#!/bin/bash

# AI-Native Research Execution System - Run Script
# This script starts both backend and frontend servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/zemul/Programming/research"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"

    # Kill backend
    if [[ -n "$BACKEND_PID" ]]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "Backend stopped"
    fi

    # Kill frontend
    if [[ -n "$FRONTEND_PID" ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "Frontend stopped"
    fi

    # Kill all background processes
    jobs -p | xargs -r kill 2>/dev/null || true

    echo -e "${GREEN}All servers stopped${NC}"
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Function to check if .env exists
check_env() {
    if [[ ! -f "$BACKEND_DIR/.env" ]]; then
        echo -e "${RED}Error: .env file not found!${NC}"
        echo "Please create .env file first:"
        echo "  cp $BACKEND_DIR/.env.template $BACKEND_DIR/.env"
        echo "  nano $BACKEND_DIR/.env  # Add your API keys"
        exit 1
    fi

    # Check if at least one API key is set
    source "$BACKEND_DIR/.env"
    if [[ -z "$OPENAI_API_KEY" ]] && [[ -z "$GEMINI_API_KEY" ]] && [[ -z "$MISTRAL_API_KEY" ]] && [[ -z "$GROQ_API_KEY" ]]; then
        echo -e "${RED}Error: No API keys found in .env file!${NC}"
        echo "Please add at least one of the following to $BACKEND_DIR/.env:"
        echo "  - OPENAI_API_KEY"
        echo "  - GEMINI_API_KEY"
        echo "  - MISTRAL_API_KEY"
        echo "  - GROQ_API_KEY"
        exit 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}Starting backend server...${NC}"
    cd "$BACKEND_DIR"

    # Activate virtual environment
    source venv/bin/activate

    # Start backend in background
    python server.py > "$PROJECT_ROOT/backend.log" 2>&1 &
    BACKEND_PID=$!

    # Wait for backend to start
    echo "Waiting for backend to start..."
    sleep 5

    # Check if backend is running
    if ps -p $BACKEND_PID > /dev/null; then
        echo -e "${GREEN}Backend started successfully (PID: $BACKEND_PID)${NC}"
        echo "Backend logs: $PROJECT_ROOT/backend.log"
    else
        echo -e "${RED}Backend failed to start! Check backend.log${NC}"
        cat "$PROJECT_ROOT/backend.log"
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}Starting frontend server...${NC}"
    cd "$FRONTEND_DIR"

    # Start frontend in background
    yarn start > "$PROJECT_ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    sleep 10

    # Check if frontend is running
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${GREEN}Frontend started successfully (PID: $FRONTEND_PID)${NC}"
        echo "Frontend logs: $PROJECT_ROOT/frontend.log"
    else
        echo -e "${YELLOW}Frontend may still be starting...${NC}"
        echo "Check frontend.log for details"
    fi
}

# Function to show status
show_status() {
    echo ""
    echo "======================================"
    echo -e "${GREEN}Servers Running!${NC}"
    echo "======================================"
    echo ""
    echo "Backend:"
    echo "  - URL: http://localhost:8000"
    echo "  - PID: $BACKEND_PID"
    echo "  - Logs: $PROJECT_ROOT/backend.log"
    echo ""
    echo "Frontend:"
    echo "  - URL: http://localhost:3000"
    echo "  - PID: $FRONTEND_PID"
    echo "  - Logs: $PROJECT_ROOT/frontend.log"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    echo ""
    echo "======================================"
    echo ""
}

# Function to watch logs
watch_logs() {
    echo -e "${BLUE}Monitoring logs (Ctrl+C to stop)...${NC}"
    echo ""

    # Show both logs
    tail -f "$PROJECT_ROOT/backend.log" "$PROJECT_ROOT/frontend.log" 2>/dev/null &
    WATCH_PID=$!

    # Wait for interrupt
    wait $WATCH_PID 2>/dev/null || true
}

# Main function
main() {
    cd "$PROJECT_ROOT"

    echo "======================================"
    echo "Research Execution System"
    echo "======================================"
    echo ""

    # Check environment
    check_env

    # Start Redis if not running
    if ! redis-cli ping >/dev/null 2>&1; then
        echo -e "${YELLOW}Starting Redis...${NC}"
        # Try systemd first
        if command_exists systemctl; then
            sudo systemctl start redis 2>/dev/null || \
            sudo systemctl start redis.service 2>/dev/null || \
            sudo systemctl start redis-server 2>/dev/null || \
            redis-server --daemonize yes
        else
            redis-server --daemonize yes
        fi
        sleep 2
    fi

    # Start servers
    start_backend
    start_frontend

    # Show status
    show_status

    # Watch logs
    watch_logs
}

# Run main function
main
