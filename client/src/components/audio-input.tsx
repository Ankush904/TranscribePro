import { useState } from 'react';
import { Upload, Mic, Square } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import RecordingWaveform from './recording-waveform';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface AudioInputProps {
  onFileSelected: (file: File) => void;
  onRecordingComplete: (blob: Blob) => void;
}

export default function AudioInput({ onFileSelected, onRecordingComplete }: AudioInputProps) {
  const [audioSource, setAudioSource] = useState<'upload' | 'record'>('upload');
  const { recording, startRecording, stopRecording, recordingBlob } = useAudioRecorder();
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };
  
  // Handle when recording stops
  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (blob) {
      onRecordingComplete(blob);
    }
  };
  
  return (
    <Card className="bg-gray-800 border-none shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-white">Audio Source</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Option */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <input 
              id="upload-option" 
              name="audio-source" 
              type="radio" 
              checked={audioSource === 'upload'}
              onChange={() => setAudioSource('upload')}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-gray-700" 
            />
            <Label htmlFor="upload-option" className="text-sm font-medium text-white">Upload audio file</Label>
          </div>
          
          {audioSource === 'upload' && (
            <div className="ml-7">
              <label className="flex justify-center w-full h-24 px-4 transition bg-gray-700 border-2 border-dashed border-gray-600 rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none">
                <span className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    Drop files or <span className="text-primary">browse</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    MP3, WAV, M4A, up to 30MB
                  </span>
                </span>
                <input 
                  type="file" 
                  name="file_upload" 
                  className="hidden" 
                  accept="audio/*"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}
        </div>
        
        {/* Record Option */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <input 
              id="record-option" 
              name="audio-source" 
              type="radio" 
              checked={audioSource === 'record'}
              onChange={() => setAudioSource('record')}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-gray-700" 
            />
            <Label htmlFor="record-option" className="text-sm font-medium text-white">Record audio</Label>
          </div>
          
          {audioSource === 'record' && (
            <div className="ml-7">
              <RecordingWaveform isRecording={recording} className="mb-3" />
              
              <div className="flex justify-center space-x-3">
                {!recording ? (
                  <Button 
                    type="button" 
                    onClick={startRecording}
                    className="inline-flex items-center"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleStopRecording} 
                    variant="destructive"
                    className="inline-flex items-center"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
