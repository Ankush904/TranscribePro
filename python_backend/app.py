from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import json
from sqlalchemy.orm import Session
from contextlib import contextmanager
import traceback

# Import from python_backend package
from python_backend.models import get_db, create_tables, Transcript
from python_backend.schemas import (
    TranscriptionRequest, TranscriptCreate, TranscriptUpdate,
    GeminiRequest, TranscriptResponse
)
from python_backend.services import TranscriptionService, GeminiService

# Initialize Flask app
app = Flask(__name__)
# Configure CORS to allow requests from the frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Create database tables if they don't exist
create_tables()

@contextmanager
def get_db_session():
    """Context manager for database sessions"""
    db = next(get_db())
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Get all transcripts
@app.route('/api/transcripts', methods=['GET'])
def get_all_transcripts():
    try:
        with get_db_session() as db:
            transcripts = db.query(Transcript).order_by(Transcript.created_at.desc()).all()
            return jsonify([
                {
                    "id": t.id,
                    "title": t.title,
                    "text": t.text,
                    "audioFileName": t.audio_file_name,
                    "duration": t.duration,
                    "wordCount": t.word_count,
                    "createdAt": t.created_at.isoformat(),
                    "apiUsed": t.api_used,
                    "modelUsed": t.model_used,
                    "options": t.options
                } for t in transcripts
            ])
    except Exception as e:
        app.logger.error(f"Error getting transcripts: {str(e)}")
        return jsonify({"message": str(e)}), 500

# Get a single transcript by ID
@app.route('/api/transcripts/<int:id>', methods=['GET'])
def get_transcript_by_id(id):
    try:
        with get_db_session() as db:
            transcript = db.query(Transcript).filter(Transcript.id == id).first()
            if not transcript:
                return jsonify({"message": "Transcript not found"}), 404
                
            return jsonify({
                "id": transcript.id,
                "title": transcript.title,
                "text": transcript.text,
                "audioFileName": transcript.audio_file_name,
                "duration": transcript.duration,
                "wordCount": transcript.word_count,
                "createdAt": transcript.created_at.isoformat(),
                "apiUsed": transcript.api_used,
                "modelUsed": transcript.model_used,
                "options": transcript.options
            })
    except Exception as e:
        app.logger.error(f"Error getting transcript: {str(e)}")
        return jsonify({"message": str(e)}), 500

# Create a new transcript
@app.route('/api/transcripts', methods=['POST'])
def create_transcript():
    try:
        data = request.json
        with get_db_session() as db:
            new_transcript = Transcript(
                title=data.get("title", "Untitled Transcript"),
                text=data.get("text", ""),
                audio_file_name=data.get("audioFileName"),
                duration=data.get("duration", 0),
                word_count=data.get("wordCount", 0),
                api_used=data.get("apiUsed", "whisper"),
                model_used=data.get("modelUsed", "base"),
                options=data.get("options", {})
            )
            
            db.add(new_transcript)
            db.flush()  # Flush to get the ID
            db.refresh(new_transcript)
            
            return jsonify({
                "id": new_transcript.id,
                "title": new_transcript.title,
                "text": new_transcript.text,
                "audioFileName": new_transcript.audio_file_name,
                "duration": new_transcript.duration,
                "wordCount": new_transcript.word_count,
                "createdAt": new_transcript.created_at.isoformat(),
                "apiUsed": new_transcript.api_used,
                "modelUsed": new_transcript.model_used,
                "options": new_transcript.options
            })
    except Exception as e:
        app.logger.error(f"Error creating transcript: {str(e)}")
        return jsonify({"message": str(e)}), 500

# Update a transcript
@app.route('/api/transcripts/<int:id>', methods=['PATCH'])
def update_transcript(id):
    try:
        data = request.json
        with get_db_session() as db:
            transcript = db.query(Transcript).filter(Transcript.id == id).first()
            if not transcript:
                return jsonify({"message": "Transcript not found"}), 404
            
            # Update fields if provided in the request
            if "title" in data:
                transcript.title = data["title"]
            if "text" in data:
                transcript.text = data["text"]
            if "duration" in data:
                transcript.duration = data["duration"]
            if "wordCount" in data:
                transcript.word_count = data["wordCount"]
                
            db.commit()
            db.refresh(transcript)
            
            return jsonify({
                "id": transcript.id,
                "title": transcript.title,
                "text": transcript.text,
                "audioFileName": transcript.audio_file_name,
                "duration": transcript.duration,
                "wordCount": transcript.word_count,
                "createdAt": transcript.created_at.isoformat(),
                "apiUsed": transcript.api_used,
                "modelUsed": transcript.model_used,
                "options": transcript.options
            })
    except Exception as e:
        app.logger.error(f"Error updating transcript: {str(e)}")
        return jsonify({"message": str(e)}), 500

# Delete a transcript
@app.route('/api/transcripts/<int:id>', methods=['DELETE'])
def delete_transcript(id):
    try:
        with get_db_session() as db:
            transcript = db.query(Transcript).filter(Transcript.id == id).first()
            if not transcript:
                return jsonify({"message": "Transcript not found"}), 404
                
            db.delete(transcript)
            return jsonify({"message": "Transcript deleted successfully"})
    except Exception as e:
        app.logger.error(f"Error deleting transcript: {str(e)}")
        return jsonify({"message": str(e)}), 500

# Upload and transcribe audio
@app.route('/api/transcribe/upload', methods=['POST'])
def transcribe_audio():
    try:
        # Check if file is present in the request
        if 'audio' not in request.files:
            return jsonify({"message": "No audio file provided"}), 400
            
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"message": "No audio file selected"}), 400
            
        # Parse transcription options from form data
        transcription_api = request.form.get('transcriptionAPI', 'whisper')
        model = request.form.get('modelUsed', 'base' if transcription_api == 'whisper' else 'nova-2')
        api_key = request.form.get('apiKey', '')
        
        # Parse options
        options_json = request.form.get('options', '{}')
        options = json.loads(options_json)
        
        # Transcribe the audio
        result = None
        if transcription_api == 'whisper':
            result = TranscriptionService.transcribe_with_whisper(
                audio_file, 
                model=model,
                api_key=api_key,
                options=options
            )
        elif transcription_api == 'deepgram':
            result = TranscriptionService.transcribe_with_deepgram(
                audio_file,
                model=model,
                api_key=api_key,
                options=options
            )
        else:
            return jsonify({"message": "Invalid transcription API"}), 400
            
        # Format response
        response = {
            "text": result["text"],
            "title": f"Transcription - {audio_file.filename}",
            "duration": result["duration"],
            "word_count": result["word_count"]
        }
        
        return jsonify(response)
    except Exception as e:
        app.logger.error(f"Error transcribing audio: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500

# Analyze transcript with Gemini
@app.route('/api/gemini/analyze', methods=['POST'])
def analyze_with_gemini():
    try:
        data = request.json
        transcript = data.get('transcript', '')
        question = data.get('question', '')
        config = data.get('config', {})
        api_key = data.get('geminiKey', '')
        
        if not transcript or not question:
            return jsonify({"message": "Transcript and question are required"}), 400
            
        # Call Gemini service
        result = GeminiService.analyze_transcript(
            transcript,
            question,
            config,
            api_key=api_key
        )
        
        return jsonify({"response": result["response"]})
    except Exception as e:
        app.logger.error(f"Error analyzing with Gemini: {str(e)}")
        return jsonify({"message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)