#!/bin/bash

# Build script for Runpod Storage Tool with Frontend

set -e

echo "🔨 Building Runpod Storage Tool with Frontend..."

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Must be run from the project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18+ to build the frontend."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm to build the frontend."
    exit 1
fi

# Navigate to frontend directory
cd frontend

echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️  Building frontend for production..."
npm run build

cd ..

echo "✅ Build complete!"
echo ""
echo "To start the server with the web interface:"
echo "  uv run runpod-storage-server"
echo ""
echo "Then open http://localhost:8000 in your browser"
