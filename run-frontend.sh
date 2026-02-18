#!/bin/bash
# Start the Research Platform Frontend

cd "$(dirname "$0")/frontend"

echo "🚀 Starting Research Platform Frontend..."
echo "   URL: http://localhost:3000"
echo ""

# Start dev server
npm run dev
