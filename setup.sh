#!/bin/bash

# AI-Native Research Execution System - Setup Script
# This script sets up the complete development environment

set -e  # Exit on error

echo "======================================"
echo "Research Execution System Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

# Check if running as root on Linux
if [[ "$OS" == "linux" ]] && [[ $EUID -eq 0 ]]; then
    echo -e "${RED}Please don't run this script as root. Use sudo only for specific commands.${NC}"
    exit 1
fi

PROJECT_ROOT="/home/zemul/Programming/research"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install system dependencies
install_system_deps() {
    echo -e "${YELLOW}Checking system dependencies...${NC}"

    if [[ "$OS" == "linux" ]]; then
        # Check for Python 3.14
        if ! command_exists python3.14; then
            echo -e "${YELLOW}Python 3.14 not found. You may need to install it manually.${NC}"
            echo "Consider using: sudo apt install python3.14 python3.14-venv"
        fi

        # Check Node.js
        if ! command_exists node; then
            echo -e "${YELLOW}Node.js not found. Installing...${NC}"
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt install -y nodejs
        fi

        # Check Yarn
        if ! command_exists yarn; then
            echo -e "${YELLOW}Yarn not found. Installing...${NC}"
            npm install -g yarn
        fi

        # Check PostgreSQL
        if ! command_exists psql; then
            echo -e "${YELLOW}PostgreSQL not found. Installing...${NC}"
            sudo apt update
            sudo apt install -y postgresql postgresql-contrib
        fi

        # Check Redis
        if ! command_exists redis-server; then
            echo -e "${YELLOW}Redis not found. Installing...${NC}"
            sudo apt install -y redis-server
        fi

        # Check Pandoc
        if ! command_exists pandoc; then
            echo -e "${YELLOW}Pandoc not found. Installing...${NC}"
            sudo apt install -y pandoc
        fi
    elif [[ "$OS" == "macos" ]]; then
        if ! command_exists brew; then
            echo -e "${RED}Homebrew not found. Please install it first:${NC}"
            echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
            exit 1
        fi

        brew install python@3.14 node yarn postgresql redis pandoc 2>/dev/null || true
    fi

    echo -e "${GREEN}System dependencies check complete!${NC}"
    echo ""
}

# Setup PostgreSQL
setup_database() {
    echo -e "${YELLOW}Setting up PostgreSQL database...${NC}"

    # Check if database exists
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw research_pilot; then
        echo "Database 'research_pilot' already exists. Skipping..."
    else
        echo "Creating database and user..."
        sudo -u postgres psql <<EOF
CREATE DATABASE research_pilot;
CREATE USER research_user WITH PASSWORD 'research_pass_2024';
GRANT ALL PRIVILEGES ON DATABASE research_pilot TO research_user;
ALTER USER research_user WITH PASSWORD 'research_pass_2024';
EOF
        echo -e "${GREEN}Database created successfully!${NC}"
    fi
    echo ""
}

# Setup Redis
setup_redis() {
    echo -e "${YELLOW}Setting up Redis...${NC}"

    if [[ "$OS" == "linux" ]]; then
        sudo systemctl start redis-server 2>/dev/null || true
        sudo systemctl enable redis-server 2>/dev/null || true
    elif [[ "$OS" == "macos" ]]; then
        brew services start redis 2>/dev/null || true
    fi

    # Test Redis connection
    if redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}Redis is running!${NC}"
    else
        echo -e "${YELLOW}Redis may not be running. Start it manually with: redis-server${NC}"
    fi
    echo ""
}

# Setup Backend
setup_backend() {
    echo -e "${YELLOW}Setting up backend...${NC}"

    cd "$BACKEND_DIR"

    # Create virtual environment
    if [[ ! -d "venv" ]]; then
        echo "Creating Python virtual environment..."
        python3.14 -m venv venv
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Install dependencies
    echo "Installing Python dependencies..."
    pip install --quiet --upgrade pip
    pip install --quiet -r requirements.txt

    # Create .env from template if it doesn't exist
    if [[ ! -f ".env" ]]; then
        echo "Creating .env file..."
        cp .env.template .env
        echo -e "${YELLOW}Please edit .env file and add your API keys!${NC}"
        echo "Location: $BACKEND_DIR/.env"
    else
        echo ".env file already exists"
    fi

    echo -e "${GREEN}Backend setup complete!${NC}"
    echo ""
}

# Setup Frontend
setup_frontend() {
    echo -e "${YELLOW}Setting up frontend...${NC}"

    cd "$FRONTEND_DIR"

    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        echo "Installing Node.js dependencies..."
        yarn install --silent
    else
        echo "Node dependencies already installed"
    fi

    echo -e "${GREEN}Frontend setup complete!${NC}"
    echo ""
}

# Create directories
create_directories() {
    echo -e "${YELLOW}Creating necessary directories...${NC}"

    mkdir -p /tmp/research_pilot_pdfs
    mkdir -p /tmp/research_pilot_exports

    echo -e "${GREEN}Directories created!${NC}"
    echo ""
}

# Main setup flow
main() {
    cd "$PROJECT_ROOT"

    install_system_deps
    setup_database
    setup_redis
    setup_backend
    setup_frontend
    create_directories

    echo ""
    echo "======================================"
    echo -e "${GREEN}Setup Complete!${NC}"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Edit API keys in: $BACKEND_DIR/.env"
    echo "2. Run the application: ./run.sh"
    echo ""
    echo "Required API keys to add:"
    echo "  - OPENAI_API_KEY"
    echo "  - GEMINI_API_KEY"
    echo "  - MISTRAL_API_KEY"
    echo "  - GROQ_API_KEY"
    echo "  - OPENROUTER_API_KEY (optional)"
    echo ""
}

# Run main function
main
