#!/bin/bash

# Start Redis Server

# Check if Redis is already running
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is already running (port 6379)"
    redis-cli ping
    exit 0
fi

# Start Redis
echo "Starting Redis on port 6379..."
redis-server --daemonize yes --port 6379

# Wait for Redis to start
sleep 2

# Verify Redis started
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis started successfully"
    redis-cli ping
else
    echo "❌ Failed to start Redis"
    exit 1
fi
