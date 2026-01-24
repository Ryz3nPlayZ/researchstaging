#!/bin/bash

# AI-Native Research Execution System - Setup Script
# Distro-agnostic Linux setup script

set -e  # Exit on error

echo "======================================"
echo "Research Execution System Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Detect package manager
detect_pkg_manager() {
    if command_exists pacman; then
        echo "pacman"
    elif command_exists apt-get; then
        echo "apt"
    elif command_exists dnf; then
        echo "dnf"
    elif command_exists yum; then
        echo "yum"
    elif command_exists zypper; then
        echo "zypper"
    elif command_exists emerge; then
        echo "emerge"
    else
        echo "unknown"
    fi
}

# Detect init system
detect_init_system() {
    if command_exists systemctl; then
        echo "systemd"
    elif command_exists openrc; then
        echo "openrc"
    elif [[ -f /etc/init.d/cron ]]; then
        echo "sysvinit"
    else
        echo "unknown"
    fi
}

# Install package using detected package manager
install_pkg() {
    local pkg_manager=$1
    shift
    local packages=("$@")

    case $pkg_manager in
        pacman)
            sudo pacman -S --needed --noconfirm "${packages[@]}" 2>/dev/null
            ;;
        apt)
            sudo apt-get update -qq
            sudo apt-get install -y "${packages[@]}" 2>/dev/null
            ;;
        dnf|yum)
            sudo dnf install -y "${packages[@]}" 2>/dev/null
            ;;
        zypper)
            sudo zypper install -y "${packages[@]}" 2>/dev/null
            ;;
        emerge)
            sudo emerge --noreplace "${packages[@]}" 2>/dev/null
            ;;
        *)
            echo -e "${RED}Unknown package manager. Please install manually: ${packages[*]}${NC}"
            return 1
            ;;
    esac
}

# Install system dependencies
install_system_deps() {
    echo -e "${YELLOW}Checking system dependencies...${NC}"

    if [[ "$OS" == "linux" ]]; then
        local pkg_manager=$(detect_pkg_manager)
        echo -e "${BLUE}Detected package manager: $pkg_manager${NC}"

        # Check for Python 3.12+
        if ! command_exists python3.14 && ! command_exists python3.13 && ! command_exists python3.12; then
            echo -e "${YELLOW}Python 3.12+ not found. Attempting to install...${NC}"
            case $pkg_manager in
                pacman)
                    install_pkg "$pkg_manager" "python"
                    ;;
                apt)
                    install_pkg "$pkg_manager" "python3" "python3-venv" "python3-pip"
                    ;;
                dnf|yum)
                    install_pkg "$pkg_manager" "python3" "python3-pip"
                    ;;
                zypper)
                    install_pkg "$pkg_manager" "python3" "python3-pip"
                    ;;
                emerge)
                    install_pkg "$pkg_manager" "dev-lang/python"
                    ;;
            esac
        fi

        # Use available Python version
        if command_exists python3.14; then
            PYTHON_CMD="python3.14"
        elif command_exists python3.13; then
            PYTHON_CMD="python3.13"
        elif command_exists python3.12; then
            PYTHON_CMD="python3.12"
        elif command_exists python3; then
            PYTHON_CMD="python3"
        else
            echo -e "${RED}No suitable Python found. Please install Python 3.12+ manually.${NC}"
            exit 1
        fi
        echo -e "${GREEN}Using Python: $PYTHON_CMD${NC}"

        # Check Node.js
        if ! command_exists node; then
            echo -e "${YELLOW}Node.js not found. Attempting to install...${NC}"
            case $pkg_manager in
                pacman)
                    install_pkg "$pkg_manager" "nodejs" "npm"
                    ;;
                apt)
                    # Use NodeSource repository for latest Node.js
                    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                    install_pkg "$pkg_manager" "nodejs"
                    ;;
                dnf|yum)
                    install_pkg "$pkg_manager" "nodejs" "npm"
                    ;;
                zypper)
                    install_pkg "$pkg_manager" "nodejs20" "npm20"
                    ;;
                emerge)
                    install_pkg "$pkg_manager" "net-libs/nodejs"
                    ;;
            esac
        fi

        # Check Yarn
        if ! command_exists yarn; then
            echo -e "${YELLOW}Yarn not found. Installing via npm...${NC}"
            sudo npm install -g yarn
        fi

        # Check PostgreSQL
        if ! command_exists psql; then
            echo -e "${YELLOW}PostgreSQL not found. Attempting to install...${NC}"
            case $pkg_manager in
                pacman)
                    install_pkg "$pkg_manager" "postgresql"
                    ;;
                apt)
                    install_pkg "$pkg_manager" "postgresql" "postgresql-contrib"
                    ;;
                dnf|yum)
                    install_pkg "$pkg_manager" "postgresql-server" "postgresql-contrib"
                    ;;
                zypper)
                    install_pkg "$pkg_manager" "postgresql" "postgresql-contrib"
                    ;;
                emerge)
                    install_pkg "$pkg_manager" "dev-db/postgresql"
                    ;;
            esac

            # Initialize database if on Arch/Fedora
            if [[ "$pkg_manager" == "pacman" ]] || [[ "$pkg_manager" == "dnf" ]] || [[ "$pkg_manager" == "yum" ]]; then
                if [[ ! -d /var/lib/postgresql/data ]] && [[ ! -d /var/lib/pgsql/data ]]; then
                    echo -e "${YELLOW}Initializing PostgreSQL database...${NC}"
                    if [[ "$pkg_manager" == "pacman" ]]; then
                        sudo mkdir -p /var/lib/postgresql/data
                        sudo chown -R postgres:postgres /var/lib/postgresql/data
                        sudo -u postgres initdb -D /var/lib/postgresql/data
                    else
                        sudo postgresql-setup --initdb
                    fi
                fi
            fi
        fi

        # Check Redis
        if ! command_exists redis-server && ! command_exists redis; then
            echo -e "${YELLOW}Redis not found. Attempting to install...${NC}"
            case $pkg_manager in
                pacman)
                    install_pkg "$pkg_manager" "redis"
                    ;;
                apt)
                    install_pkg "$pkg_manager" "redis-server"
                    ;;
                dnf|yum)
                    install_pkg "$pkg_manager" "redis"
                    ;;
                zypper)
                    install_pkg "$pkg_manager" "redis"
                    ;;
                emerge)
                    install_pkg "$pkg_manager" "dev-db/redis"
                    ;;
            esac
        fi

        # Check Pandoc
        if ! command_exists pandoc; then
            echo -e "${YELLOW}Pandoc not found. Attempting to install...${NC}"
            case $pkg_manager in
                pacman)
                    install_pkg "$pkg_manager" "pandoc"
                    ;;
                apt)
                    install_pkg "$pkg_manager" "pandoc"
                    ;;
                dnf|yum)
                    install_pkg "$pkg_manager" "pandoc"
                    ;;
                zypper)
                    install_pkg "$pkg_manager" "pandoc"
                    ;;
                emerge)
                    install_pkg "$pkg_manager" "app-text/pandoc"
                    ;;
            esac
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

    # Start PostgreSQL first
    echo "Starting PostgreSQL..."
    if [[ "$OS" == "linux" ]]; then
        local init_system=$(detect_init_system)

        case $init_system in
            systemd)
                # Try multiple possible service names
                sudo systemctl start postgresql 2>/dev/null || \
                sudo systemctl start postgresql.service 2>/dev/null || \
                sudo systemctl start postgresql-15 2>/dev/null || true
                ;;
            openrc)
                sudo rc-service postgresql start 2>/dev/null || true
                ;;
            *)
                # Fallback: try to start postgres manually
                if [[ -d /var/lib/postgresql/data ]]; then
                    sudo -u postgres pg_ctl start -D /var/lib/postgresql/data 2>/dev/null || true
                elif [[ -d /var/lib/pgsql/data ]]; then
                    sudo -u postgres pg_ctl start -D /var/lib/pgsql/data 2>/dev/null || true
                fi
                ;;
        esac
    fi

    # Wait for PostgreSQL to be ready
    sleep 2

    # Check if database exists
    if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw research_pilot; then
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
        local init_system=$(detect_init_system)

        case $init_system in
            systemd)
                # Try multiple possible service names
                sudo systemctl start redis 2>/dev/null || \
                sudo systemctl start redis.service 2>/dev/null || \
                sudo systemctl start redis-server 2>/dev/null || \
                true

                sudo systemctl enable redis 2>/dev/null || \
                sudo systemctl enable redis.service 2>/dev/null || \
                sudo systemctl enable redis-server 2>/dev/null || \
                true
                ;;
            openrc)
                sudo rc-service redis start 2>/dev/null || true
                ;;
            *)
                # Fallback: start redis-server directly
                redis-server --daemonize yes 2>/dev/null || true
                ;;
        esac
    elif [[ "$OS" == "macos" ]]; then
        brew services start redis 2>/dev/null || true
    fi

    # Test Redis connection
    if redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}Redis is running!${NC}"
    else
        echo -e "${YELLOW}Redis may not be running. Start it manually with: sudo systemctl start redis${NC}"
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
        $PYTHON_CMD -m venv venv
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
    echo "Required API keys to add (at least one):"
    echo "  - OPENAI_API_KEY"
    echo "  - GEMINI_API_KEY"
    echo "  - MISTRAL_API_KEY"
    echo "  - GROQ_API_KEY"
    echo "  - OPENROUTER_API_KEY (optional)"
    echo ""
}

# Run main function
main
