#!/bin/bash
# Quick start with Docker for PostgreSQL and Redis

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Starting Docker services (PostgreSQL + Redis)...${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Start docker-compose
docker-compose up -d

echo -e "${GREEN}✓ Docker services started${NC}"
echo ""
echo -e "${GREEN}PostgreSQL:${NC} localhost:5432"
echo -e "${GREEN}Redis:${NC}       localhost:6379"
echo ""
echo -e "${YELLOW}To stop services:${NC} docker-compose down"
echo ""
