import os
import requests
import json
import google.generativeai as genai
from dotenv import load_dotenv
import tempfile
import re

# Load environment variables
load_dotenv()

# API Keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class TranscriptionService:
    @staticmethod
    def transcribe_with_whisper(audio_file, model="base", api_key=None, options=None):
        """Transcribe audio using OpenAI's Whisper API"""
        # Use provided API key or fall back to environment variable
        api_key = api_key or OPENAI_API_KEY
        
        if not api_key:
            raise Exception("OpenAI API key is missing")
        
        temp_file_path = None
        try:
            # Save audio file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
                temp_file.write(audio_file.read())
                temp_file_path = temp_file.name
            
            headers = {
                "Authorization": f"Bearer {api_key}"
            }
            
            with open(temp_file_path, "rb") as f:
                files = {
                    "file": f,
                    "model": (None, model),
                    "response_format": (None, "json"),
                }
                
                response = requests.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers=headers,
                    files=files
                )
                
                if response.status_code != 200:
                    raise Exception(f"Whisper API error: {response.status_code} - {response.text}")
                
                result = response.json()
                
                # Count words in transcript
                word_count = len(re.findall(r'\w+', result.get("text", "")))
                
                return {
                    "text": result.get("text", ""),
                    "duration": result.get("duration", 0),
                    "word_count": word_count
                }
                
        except Exception as e:
            raise Exception(f"Error transcribing with Whisper: {str(e)}")
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    @staticmethod
    def transcribe_with_deepgram(audio_file, model="nova-2", api_key=None, options=None):
        """Transcribe audio using Deepgram API"""
        # Use provided API key or fall back to environment variable
        api_key = api_key or DEEPGRAM_API_KEY
        
        if not api_key:
            raise Exception("Deepgram API key is missing")
        
        # Build query parameters
        params = {
            "model": model,
            "punctuate": "true" if options and options.autoPunctuate else "false",
            "diarize": "true" if options and options.speakerDiarization else "false",
            "utterances": "true" if options and options.wordTimestamps else "false"
        }
        
        headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": "audio/mp3"
        }
        
        temp_file_path = None
        try:
            # Save audio file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
                temp_file.write(audio_file.read())
                temp_file_path = temp_file.name
            
            with open(temp_file_path, "rb") as f:
                response = requests.post(
                    "https://api.deepgram.com/v1/listen", 
                    headers=headers,
                    params=params,
                    data=f
                )
            
            if response.status_code != 200:
                raise Exception(f"Deepgram API error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            # Extract transcript text and metadata
            transcript_text = result.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "")
            duration = result.get("metadata", {}).get("duration", 0)
            
            # Count words in transcript
            word_count = len(re.findall(r'\w+', transcript_text))
            
            return {
                "text": transcript_text,
                "duration": duration,
                "word_count": word_count
            }
            
        except Exception as e:
            raise Exception(f"Error transcribing with Deepgram: {str(e)}")
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

class GeminiService:
    @staticmethod
    def analyze_transcript(transcript_text, question, config, api_key=None):
        """Analyze transcript using Google's Gemini API"""
        # Use provided API key or fall back to environment variable
        api_key = api_key or GEMINI_API_KEY
        
        if not api_key:
            raise Exception("Gemini API key is missing")
            
        try:
            genai.configure(api_key=api_key)
            
            # Configure the model
            generation_config = {
                "temperature": config.temperature,
                "top_p": 0.9,
                "max_output_tokens": config.maxTokens,
                "response_mime_type": "text/plain",
            }
            
            # Setup system instruction
            system_instruction = "You are an AI assistant analyzing a transcript. Answer questions about the transcript content only based on the provided text. Keep your answers concise and relevant."
            
            # Create the model
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash-latest",
                generation_config=generation_config,
                system_instruction=system_instruction
            )
            
            # Prepare the prompt
            prompt = f"Here is a transcript:\n\n{transcript_text}\n\nQuestion: {question}"
            
            # Generate the response
            response = model.generate_content(prompt)
            
            return {
                "response": response.text
            }
            
        except Exception as e:
            raise Exception(f"Error analyzing with Gemini: {str(e)}")