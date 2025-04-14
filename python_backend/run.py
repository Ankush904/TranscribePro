from flask import Flask
from flask_cors import CORS
import os
import sys

# Add the parent directory to sys.path to ensure imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import app modules without relative imports
from python_backend.app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))  # Use a different port than the frontend
    app.run(host='0.0.0.0', port=port, debug=True)