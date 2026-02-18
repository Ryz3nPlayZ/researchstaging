#!/usr/bin/env bash
# Research UI — Dev Server
# Usage: ./start.sh

set -e

cd "$(dirname "$0")"

echo "🚀 Starting Research UI..."
echo "   http://localhost:3000"
echo ""

npm run dev
