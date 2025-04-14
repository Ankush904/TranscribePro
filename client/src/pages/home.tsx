import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Mic, Plus, Layers, Settings, CheckCircle } from "lucide-react";
import AudioInput from "@/components/audio-input";
import TranscriptionOptions from "@/components/transcription-options";
import TranscriptionPanel from "@/components/transcription-panel";
import GeminiPanel from "@/components/gemini-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TranscriptionOptions as TranscriptionOptionsType, Transcript } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // State for the transcription workflow
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcriptionAPI, setTranscriptionAPI] = useState<'whisper' | 'deepgram'>('whisper');
  const [whisperModel, setWhisperModel] = useState<string>('medium');
  const [deepgramModel, setDeepgramModel] = useState<string>('nova-2');
  const [transcriptionOptions, setTranscriptionOptions] = useState<TranscriptionOptionsType>({
    autoPunctuate: true,
    speakerDiarization: false,
    wordTimestamps: false
  });
  
  // State for managing the transcript
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showGeminiPanel, setShowGeminiPanel] = useState(false);
  
  // Handle file upload
  const handleFileSelected = (file: File) => {
    setAudioFile(file);
    setAudioBlob(null);
    toast({
      title: "Audio file selected",
      description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
    });
  };
  
  // Handle recording complete
  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setAudioFile(null);
    toast({
      title: "Recording complete",
      description: `${(blob.size / (1024 * 1024)).toFixed(2)} MB audio recorded`,
    });
  };
  
  // Function to start transcription
  const handleTranscribe = async () => {
    if (!audioFile && !audioBlob) {
      toast({
        title: "No audio to transcribe",
        description: "Please upload a file or record audio first",
        variant: "destructive"
      });
      return;
    }
    
    setIsTranscribing(true);
    
    const formData = new FormData();
    if (audioFile) {
      formData.append('audio', audioFile);
    } else if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.wav');
    }
    
    formData.append('api', transcriptionAPI);
    formData.append('model', transcriptionAPI === 'whisper' ? whisperModel : deepgramModel);
    formData.append('options', JSON.stringify(transcriptionOptions));
    
    try {
      const response = await fetch('/api/transcribe/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transcription failed');
      }
      
      const result = await response.json();
      
      // Create temporary transcript object
      setTranscript({
        id: 0, // This will be replaced if saved
        title: audioFile ? audioFile.name.split('.')[0] : "New Recording",
        text: result.text,
        audioFileName: audioFile ? audioFile.name : "recording.wav",
        duration: result.duration,
        wordCount: result.wordCount,
        createdAt: new Date(),
        apiUsed: transcriptionAPI,
        modelUsed: transcriptionAPI === 'whisper' ? whisperModel : deepgramModel,
        options: transcriptionOptions
      });
      
      toast({
        title: "Transcription complete",
        description: `${result.wordCount} words transcribed`,
      });
      
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Save transcript to storage
  const handleSaveTranscript = async () => {
    if (!transcript) return;
    
    try {
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcript),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save transcript');
      }
      
      const savedTranscript = await response.json();
      setTranscript(savedTranscript);
      
      toast({
        title: "Transcript saved",
        description: "Your transcript has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-dark-800 p-4 flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center">
            <Mic className="h-6 w-6 mr-2 text-primary" />
            Transcription App
          </h1>
        </div>
        
        <nav className="flex-1">
          <div className="space-y-1">
            <Link href="/">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group`}>
                <Plus className="h-5 w-5 mr-3 text-primary" />
                New Transcription
              </a>
            </Link>
            
            <Link href="/saved-transcripts">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/saved-transcripts' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group`}>
                <Layers className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary" />
                Saved Transcripts
              </a>
            </Link>
            
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white group">
              <Settings className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary" />
              Settings
            </a>
          </div>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center text-sm text-gray-300">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            APIs Connected
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">New Transcription</h2>
            <p className="text-gray-400">Upload audio or record directly to transcribe</p>
          </div>

          <Tabs defaultValue="audio-input" className="mb-8">
            <TabsList className="border-b border-gray-700 w-full justify-start">
              <TabsTrigger value="audio-input" className="data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm rounded-none">
                Audio Input
              </TabsTrigger>
              <TabsTrigger value="saved-transcripts" className="data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-400 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm rounded-none">
                Saved Transcripts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="audio-input" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Audio Input Component */}
                <AudioInput 
                  onFileSelected={handleFileSelected} 
                  onRecordingComplete={handleRecordingComplete} 
                />
                
                {/* Transcription Options Component */}
                <TranscriptionOptions 
                  transcriptionAPI={transcriptionAPI}
                  setTranscriptionAPI={setTranscriptionAPI}
                  whisperModel={whisperModel}
                  setWhisperModel={setWhisperModel}
                  deepgramModel={deepgramModel}
                  setDeepgramModel={setDeepgramModel}
                  options={transcriptionOptions}
                  setOptions={setTranscriptionOptions}
                  onTranscribe={handleTranscribe}
                  isTranscribing={isTranscribing}
                  hasAudio={!!audioFile || !!audioBlob}
                />
              </div>
              
              {/* Transcription Result Panel */}
              {transcript && (
                <TranscriptionPanel 
                  transcript={transcript}
                  onSave={handleSaveTranscript}
                  onUpdateText={(text) => setTranscript({...transcript, text})}
                  onShowGemini={() => setShowGeminiPanel(true)}
                />
              )}
              
              {/* Gemini Analysis Panel */}
              {transcript && showGeminiPanel && (
                <GeminiPanel 
                  transcript={transcript}
                  onClose={() => setShowGeminiPanel(false)}
                />
              )}
            </TabsContent>
            
            <TabsContent value="saved-transcripts">
              <div className="text-center py-6 text-gray-400">
                <p>Switch to the Saved Transcripts page to view your saved transcripts</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
