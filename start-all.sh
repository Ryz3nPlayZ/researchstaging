#!/bin/bash

# Start All Services
# Run each script in a separate terminal

echo "🚀 Starting Research Pilot Services"
echo ""
echo "To start all services, run each in a separate terminal:"
echo ""
echo "  Terminal 1: ./start-backend.sh"
echo "  Terminal 2: ./start-frontend-v2.sh"
echo "  Terminal 3 (optional): ./start-frontend-v1.sh"
echo ""
echo "Or use this command to start in background:"
echo "  ./start-backend.sh &"
echo "  sleep 5"
echo "  ./start-frontend-v2.sh &"
echo ""

# Quick start option
if [ "$1" == "--background" ]; then
    echo "Starting in background..."
    ./start-backend.sh > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    sleep 5
    ./start-frontend-v2.sh > /tmp/frontend-v2.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend V2 PID: $FRONTEND_PID"
    echo ""
    echo "Backend: http://localhost:8000"
    echo "Frontend V2: http://localhost:3001"
    echo ""
    echo "To stop:"
    echo "  kill $BACKEND_PID $FRONTEND_PID"
    echo ""
    echo "Or:"
    echo "  pkill -f 'uvicorn server:app'"
    echo "  pkill -f 'react-scripts'"
fi
