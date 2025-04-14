#!/bin/bash

# Make sure environment variables are loaded
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  export $(cat .env | grep -v ^# | xargs)
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start Python backend in the background
echo "Starting Python backend on port 5001..."
cd python_backend && python run.py &
PYTHON_PID=$!

# Wait for Python backend to initialize
echo "Waiting for Python backend to initialize..."
sleep 3

# Start Node.js frontend
echo "Starting Node.js frontend on port 5000..."
cd ..
npm run dev

# When Node.js stops, also stop the Python backend
echo "Shutting down Python backend..."
kill $PYTHON_PID