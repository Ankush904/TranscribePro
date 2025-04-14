import { transcriptionAPIConfig, TranscriptionOptions as TranscriptionOptionsType } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface TranscriptionOptionsProps {
  transcriptionAPI: 'whisper' | 'deepgram';
  setTranscriptionAPI: (api: 'whisper' | 'deepgram') => void;
  whisperModel: string;
  setWhisperModel: (model: string) => void;
  deepgramModel: string;
  setDeepgramModel: (model: string) => void;
  options: TranscriptionOptionsType;
  setOptions: (options: TranscriptionOptionsType) => void;
  onTranscribe: () => void;
  isTranscribing: boolean;
  hasAudio: boolean;
}

export default function TranscriptionOptions({
  transcriptionAPI,
  setTranscriptionAPI,
  whisperModel,
  setWhisperModel,
  deepgramModel,
  setDeepgramModel,
  options,
  setOptions,
  onTranscribe,
  isTranscribing,
  hasAudio
}: TranscriptionOptionsProps) {
  // Handle option changes
  const handleOptionsChange = (key: keyof TranscriptionOptionsType, value: boolean) => {
    setOptions({
      ...options,
      [key]: value
    });
  };
  
  return (
    <Card className="bg-gray-800 border-none shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-white">Transcription Options</CardTitle>
      </CardHeader>
      <CardContent>
        {/* API Selection */}
        <div className="mb-5">
          <Label htmlFor="api-selection" className="block text-sm font-medium text-gray-300 mb-1">
            Transcription API
          </Label>
          <Select 
            value={transcriptionAPI}
            onValueChange={(value: 'whisper' | 'deepgram') => setTranscriptionAPI(value)}
          >
            <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select API" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whisper">OpenAI Whisper</SelectItem>
              <SelectItem value="deepgram">Deepgram</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Whisper Model Options */}
        {transcriptionAPI === 'whisper' && (
          <div className="mb-5">
            <Label htmlFor="whisper-model" className="block text-sm font-medium text-gray-300 mb-1">
              Whisper Model
            </Label>
            <Select 
              value={whisperModel}
              onValueChange={setWhisperModel}
            >
              <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {transcriptionAPIConfig.whisper.models.map(model => (
                  <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-gray-500">Larger models are more accurate but require more processing time.</p>
          </div>
        )}
        
        {/* Deepgram Model Options */}
        {transcriptionAPI === 'deepgram' && (
          <div className="mb-5">
            <Label htmlFor="deepgram-model" className="block text-sm font-medium text-gray-300 mb-1">
              Deepgram Model
            </Label>
            <Select 
              value={deepgramModel}
              onValueChange={setDeepgramModel}
            >
              <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {transcriptionAPIConfig.deepgram.models.map(model => (
                  <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Additional Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="auto-punctuate" 
              checked={options.autoPunctuate}
              onCheckedChange={(checked) => 
                handleOptionsChange('autoPunctuate', checked === true)
              }
            />
            <Label htmlFor="auto-punctuate" className="text-sm text-gray-300">
              Auto-punctuate
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="speaker-diarization" 
              checked={options.speakerDiarization}
              onCheckedChange={(checked) => 
                handleOptionsChange('speakerDiarization', checked === true)
              }
            />
            <Label htmlFor="speaker-diarization" className="text-sm text-gray-300">
              Speaker diarization (identify different speakers)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="word-timestamps" 
              checked={options.wordTimestamps}
              onCheckedChange={(checked) => 
                handleOptionsChange('wordTimestamps', checked === true)
              }
            />
            <Label htmlFor="word-timestamps" className="text-sm text-gray-300">
              Include word-level timestamps
            </Label>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            onClick={onTranscribe} 
            disabled={!hasAudio || isTranscribing}
            className="w-full"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
