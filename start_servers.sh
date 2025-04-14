#!/bin/bash

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start Python backend in the background
echo "Starting Python backend..."
python -m python_backend.run &
PYTHON_PID=$!

# Wait for Python backend to initialize
sleep 3

# Start Node.js frontend
echo "Starting Node.js frontend..."
npm run dev

# When Node.js stops, also stop the Python backend
echo "Shutting down Python backend..."
kill $PYTHON_PID