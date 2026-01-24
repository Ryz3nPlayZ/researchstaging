#!/bin/bash

# AI-Native Research Execution System - Run Script
# This script starts both backend and frontend servers in separate terminals

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

# Array to store child process PIDs
PIDS=()

# Function to detect available terminal emulator
detect_terminal() {
    # List of terminal emulators to try (in order of preference)
    TERMINALS=(
        "gnome-terminal"
        "konsole"
        "xfce4-terminal"
        "mate-terminal"
        "lxterminal"
        "alacritty"
        "kitty"
        "termite"
        "rxvt"
        "xterm"
    )

    for term in "${TERMINALS[@]}"; do
        if command_exists "$term"; then
            echo "$term"
            return
        fi
    done

    echo ""
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"

    # Kill all tracked PIDs
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            echo "Stopped process (PID: $pid)"
        fi
    done

    # Also kill by process name to be thorough
    pkill -f "python.*server.py" 2>/dev/null || true
    pkill -f "yarn.*start" 2>/dev/null || true
    pkill -f "react-scripts.*start" 2>/dev/null || true

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

# Function to start backend in new terminal
start_backend() {
    echo -e "${BLUE}Starting backend server in new terminal...${NC}"

    cd "$BACKEND_DIR"

    # Create a temporary script for the terminal to run
    local temp_script=$(mktemp)
    cat > "$temp_script" <<SCRIPT
#!/bin/bash
cd "$BACKEND_DIR"
source venv/bin/activate
echo "=========================================="
echo "Backend Server"
echo "=========================================="
echo "Press Ctrl+C to stop this server"
echo "=========================================="
echo ""
python server.py
echo ""
echo "Backend server stopped. Press Enter to close this terminal."
read
SCRIPT

    chmod +x "$temp_script"

    # Detect terminal and launch
    local terminal=$(detect_terminal)

    if [[ -z "$terminal" ]]; then
        echo -e "${RED}No supported terminal emulator found!${NC}"
        echo "Falling back to background mode with log file..."
        python server.py > "$PROJECT_ROOT/backend.log" 2>&1 &
        PIDS+=($!)
        echo -e "${GREEN}Backend started in background (PID: ${PIDS[-1]})${NC}"
        echo "Logs: $PROJECT_ROOT/backend.log"
        return
    fi

    case "$terminal" in
        gnome-terminal|mate-terminal|xfce4-terminal|lxterminal)
            "$terminal" --title="Backend Server" -- bash -c "bash '$temp_script'; exec bash" &
            ;;
        konsole)
            "$terminal" --title="Backend Server" -e bash "$temp_script" &
            ;;
        alacritty|kitty)
            "$terminal" --title="Backend Server" -e bash "$temp_script" &
            ;;
        termite)
            "$terminal" --name="Backend Server" -e bash "$temp_script" &
            ;;
        rxvt|xterm)
            "$terminal" -title "Backend Server" -e bash "$temp_script" &
            ;;
        *)
            "$terminal" -e bash "$temp_script" &
            ;;
    esac

    PIDS+=($!)
    sleep 2
    echo -e "${GREEN}Backend terminal opened${NC}"
}

# Function to start frontend in new terminal
start_frontend() {
    echo -e "${BLUE}Starting frontend server in new terminal...${NC}"

    cd "$FRONTEND_DIR"

    # Create a temporary script for the terminal to run
    local temp_script=$(mktemp)
    cat > "$temp_script" <<SCRIPT
#!/bin/bash
cd "$FRONTEND_DIR"
echo "=========================================="
echo "Frontend Server"
echo "=========================================="
echo "Press Ctrl+C to stop this server"
echo "=========================================="
echo ""
yarn start
echo ""
echo "Frontend server stopped. Press Enter to close this terminal."
read
SCRIPT

    chmod +x "$temp_script"

    # Detect terminal and launch
    local terminal=$(detect_terminal)

    if [[ -z "$terminal" ]]; then
        echo -e "${RED}No supported terminal emulator found!${NC}"
        echo "Falling back to background mode with log file..."
        yarn start > "$PROJECT_ROOT/frontend.log" 2>&1 &
        PIDS+=($!)
        echo -e "${GREEN}Frontend started in background (PID: ${PIDS[-1]})${NC}"
        echo "Logs: $PROJECT_ROOT/frontend.log"
        return
    fi

    case "$terminal" in
        gnome-terminal|mate-terminal|xfce4-terminal|lxterminal)
            "$terminal" --title="Frontend Server" -- bash -c "bash '$temp_script'; exec bash" &
            ;;
        konsole)
            "$terminal" --title="Frontend Server" -e bash "$temp_script" &
            ;;
        alacritty|kitty)
            "$terminal" --title="Frontend Server" -e bash "$temp_script" &
            ;;
        termite)
            "$terminal" --name="Frontend Server" -e bash "$temp_script" &
            ;;
        rxvt|xterm)
            "$terminal" -title "Frontend Server" -e bash "$temp_script" &
            ;;
        *)
            "$terminal" -e bash "$temp_script" &
            ;;
    esac

    PIDS+=($!)
    sleep 2
    echo -e "${GREEN}Frontend terminal opened${NC}"
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
    echo "  - Terminal: 'Backend Server'"
    echo ""
    echo "Frontend:"
    echo "  - URL: http://localhost:3000"
    echo "  - Terminal: 'Frontend Server'"
    echo ""
    echo "Two terminal windows should have opened with live logs."
    echo "Close the terminals or press Ctrl+C here to stop all servers."
    echo ""
    echo "======================================"
    echo ""
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

    # Detect and display terminal
    local terminal=$(detect_terminal)
    if [[ -n "$terminal" ]]; then
        echo -e "${GREEN}Detected terminal: $terminal${NC}"
    else
        echo -e "${YELLOW}Warning: No supported terminal found${NC}"
        echo "Servers will run in background with log files instead."
    fi
    echo ""

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
        echo -e "${GREEN}Redis started${NC}"
    fi
    echo ""

    # Start servers in separate terminals
    start_backend
    sleep 1
    start_frontend

    # Give servers time to start
    echo -e "${YELLOW}Waiting for servers to initialize...${NC}"
    sleep 5

    # Show status
    show_status

    # Keep this script running to track PIDs for cleanup
    echo "Press Ctrl+C to stop all servers..."
    echo ""

    # Wait indefinitely (until Ctrl+C)
    while true; do
        sleep 1
    done
}

# Run main function
main
