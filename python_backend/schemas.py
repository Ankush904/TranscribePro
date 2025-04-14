from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# Transcription Options
class TranscriptionOptions(BaseModel):
    autoPunctuate: bool = True
    speakerDiarization: bool = False
    wordTimestamps: bool = False

# Transcript Schemas
class TranscriptBase(BaseModel):
    title: str
    text: str
    audio_file_name: Optional[str] = None
    duration: int = 0
    word_count: int = 0
    api_used: str  # 'whisper' or 'deepgram'
    model_used: str
    options: TranscriptionOptions

class TranscriptCreate(TranscriptBase):
    pass

class TranscriptUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    duration: Optional[int] = None
    word_count: Optional[int] = None
    
class TranscriptResponse(TranscriptBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Gemini Analysis
class GeminiConfig(BaseModel):
    temperature: float = Field(0.2, ge=0.0, le=1.0)
    maxTokens: int = Field(1000, ge=100, le=2000)

class GeminiRequest(BaseModel):
    transcript: str
    question: str
    config: GeminiConfig
    geminiKey: Optional[str] = None  # Client-provided API key

class GeminiResponse(BaseModel):
    response: str

# Transcription Request
class TranscriptionRequest(BaseModel):
    transcriptionAPI: str  # 'whisper' or 'deepgram'
    apiKey: Optional[str] = None  # Client-provided API key
    modelUsed: str
    options: TranscriptionOptions

class TranscriptionResponse(BaseModel):
    text: str
    title: str = "Untitled Transcript"
    duration: int = 0
    word_count: int = 0