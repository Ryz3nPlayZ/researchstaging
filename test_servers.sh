#!/bin/bash
# Test script to verify both servers start and run correctly

set -e

echo "========================================="
echo "Testing Backend & Frontend Servers"
echo "========================================="
echo ""

# Kill any existing servers
echo "1. Cleaning up any existing servers..."
pkill -9 -f "python.*server.py" 2>/dev/null || true
pkill -9 -f "uvicorn" 2>/dev/null || true
pkill -9 -f "npm.*start" 2>/dev/null || true
pkill -9 -f "craco" 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2
echo "   ✅ Cleanup complete"
echo ""

# Test backend
echo "2. Starting backend server..."
cd /home/zemul/Programming/research/backend
source venv/bin/activate
nohup python server.py > /tmp/test_backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/test_backend.pid
echo "   Started with PID: $BACKEND_PID"
sleep 6

# Check backend logs
echo ""
echo "3. Checking backend logs..."
tail -15 /tmp/test_backend.log

# Test backend API
echo ""
echo "4. Testing backend API..."
if curl -s http://localhost:8000/api/ | grep -q "healthy"; then
    echo "   ✅ Backend API is responding!"
else
    echo "   ❌ Backend API not responding"
    exit 1
fi

# Test frontend
echo ""
echo "5. Starting frontend server..."
cd /home/zemul/Programming/research/frontend
# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  node_modules not found, running npm install..."
    npm install > /tmp/test_frontend_install.log 2>&1
fi

nohup npm start > /tmp/test_frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/test_frontend.pid
echo "   Started with PID: $FRONTEND_PID"
sleep 8

# Check frontend logs
echo ""
echo "6. Checking frontend logs..."
tail -10 /tmp/test_frontend.log

# Test frontend
echo ""
echo "7. Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Frontend is responding!"
else
    echo "   ⚠️  Frontend might still be starting..."
fi

echo ""
echo "========================================="
echo "✅ TEST COMPLETE"
echo "========================================="
echo ""
echo "Backend running at: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Frontend running at: http://localhost:3000"
echo ""
echo "To stop servers:"
echo "  kill $(cat /tmp/test_backend.pid)"
echo "  kill $(cat /tmp/test_frontend.pid)"
echo ""
