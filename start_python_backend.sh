#!/bin/bash

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start Python backend
echo "Starting Python backend..."
python -m python_backend.run