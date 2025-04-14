import { apiRequest } from "./queryClient";
import type { TranscriptionOptions } from "@shared/schema";

/**
 * Upload audio file for transcription
 */
export async function transcribeAudioFile(
  audioFile: File | Blob,
  api: 'whisper' | 'deepgram',
  model: string,
  options: TranscriptionOptions
) {
  const formData = new FormData();
  formData.append('audio', audioFile, audioFile instanceof File ? audioFile.name : 'recording.wav');
  formData.append('api', api);
  formData.append('model', model);
  formData.append('options', JSON.stringify(options));
  
  // Add API keys from localStorage if available
  const openaiKey = localStorage.getItem('OPENAI_API_KEY');
  const deepgramKey = localStorage.getItem('DEEPGRAM_API_KEY');
  
  if (api === 'whisper' && openaiKey) {
    formData.append('openaiKey', openaiKey);
  }
  
  if (api === 'deepgram' && deepgramKey) {
    formData.append('deepgramKey', deepgramKey);
  }
  
  const response = await fetch('/api/transcribe/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Transcription failed');
  }
  
  return response.json();
}

/**
 * Analyze transcript with Gemini
 */
export async function analyzeWithGemini(
  transcript: string, 
  question: string, 
  temperature: number = 0.2,
  maxTokens: number = 1000
) {
  // Get Gemini API key from localStorage
  const geminiKey = localStorage.getItem('GEMINI_API_KEY');
  
  const response = await apiRequest('POST', '/api/gemini/analyze', {
    transcript,
    question,
    config: {
      temperature,
      maxTokens
    },
    geminiKey // Pass API key to server
  });
  
  return response.json();
}

/**
 * Save transcript
 */
export async function saveTranscript(transcript: any) {
  const response = await apiRequest('POST', '/api/transcripts', transcript);
  return response.json();
}

/**
 * Get all transcripts
 */
export async function getAllTranscripts() {
  const response = await apiRequest('GET', '/api/transcripts');
  return response.json();
}

/**
 * Get transcript by ID
 */
export async function getTranscriptById(id: number) {
  const response = await apiRequest('GET', `/api/transcripts/${id}`);
  return response.json();
}

/**
 * Update transcript
 */
export async function updateTranscript(id: number, data: Partial<any>) {
  const response = await apiRequest('PATCH', `/api/transcripts/${id}`, data);
  return response.json();
}

/**
 * Delete transcript
 */
export async function deleteTranscript(id: number) {
  await apiRequest('DELETE', `/api/transcripts/${id}`);
  return true;
}
