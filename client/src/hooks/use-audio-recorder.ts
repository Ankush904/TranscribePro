import { useState, useEffect, useCallback } from 'react';

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Reset audio chunks when starting a new recording
  useEffect(() => {
    if (recording) {
      setAudioChunks([]);
    }
  }, [recording]);
  
  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);
  
  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      });
      
      recorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setRecordingBlob(audioBlob);
        
        // Stop all tracks from the stream
        stream.getTracks().forEach(track => track.stop());
      });
      
      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [audioChunks]);
  
  // Stop recording function
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorder) {
      return null;
    }
    
    return new Promise((resolve) => {
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
      }, { once: true });
      
      mediaRecorder.stop();
      setRecording(false);
    });
  }, [mediaRecorder, audioChunks]);
  
  return {
    recording,
    audioURL,
    recordingBlob,
    startRecording,
    stopRecording
  };
}
