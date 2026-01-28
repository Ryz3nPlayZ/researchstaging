#!/bin/bash

# Start Backend Server

cd /home/zemul/Programming/research/backend

# Start Redis if not running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis..."
    redis-server --daemonize yes --port 6379
    sleep 2
fi

# Activate venv and start backend
echo "Starting Backend on http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""

./venv/bin/uvicorn server:app --reload --host 0.0.0.0 --port 8000
