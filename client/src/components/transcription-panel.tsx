import { useState, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';
import { Transcript } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Save, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionPanelProps {
  transcript: Transcript;
  onSave: () => void;
  onUpdateText: (text: string) => void;
  onShowGemini: () => void;
}

export default function TranscriptionPanel({ 
  transcript, 
  onSave, 
  onUpdateText,
  onShowGemini
}: TranscriptionPanelProps) {
  const { toast } = useToast();
  
  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript.text)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Transcript text has been copied to clipboard",
        });
      })
      .catch(err => {
        toast({
          title: "Copy failed",
          description: "Failed to copy transcript to clipboard",
          variant: "destructive"
        });
      });
  };
  
  const handleDownloadTranscript = () => {
    const blob = new Blob([transcript.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcript.title || 'transcript'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your transcript file is being downloaded",
    });
  };
  
  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    onUpdateText(newText);
  };
  
  return (
    <Card className="bg-gray-800 border-none shadow-lg mb-6">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium text-white">Transcription Result</CardTitle>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSave}
            className="text-xs text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyTranscript}
            className="text-xs text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadTranscript}
            className="text-xs text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="mb-4 h-80 overflow-y-auto bg-gray-900 rounded-md p-4 text-gray-100 font-mono text-sm whitespace-pre-wrap" 
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleTextChange}
        >
          {transcript.text}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {formatDuration(transcript.duration)} • {transcript.wordCount} words
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onShowGemini}
            className="text-xs"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Ask Gemini about this transcript
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
