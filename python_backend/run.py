from flask import Flask
from flask_cors import CORS
import os
import sys

# Import the app directly since we're in the same directory
from app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))  # Use a different port than the frontend
    app.run(host='0.0.0.0', port=port, debug=True)