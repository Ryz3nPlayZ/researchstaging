#!/bin/bash

# Quick Start Script - Research Pilot Backend & Frontend

echo "🚀 Starting Research Pilot Development Environment..."
echo ""

# Check if Redis is running
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is already running"
else
    echo "⚠️  Starting Redis..."
    redis-server --daemonize yes --port 6379
    sleep 2
    echo "✅ Redis started"
fi

echo ""
echo "📡 Backend Starting..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""
echo "💡 To start backend manually:"
echo "   cd /home/zemul/Programming/research/backend"
echo "   source venv/bin/activate"
echo "   uvicorn server:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "🎨 Frontend Instructions:"
echo "   cd /home/zemul/Programming/research/frontend-v2"
echo "   npm start"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📋 Frontend Checklist:"
echo "   cat /home/zemul/Programming/research/frontend-v2/FRONTEND_CHECKLIST.md"
echo ""
