import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Mic, Plus, Layers, Settings as SettingsIcon, CheckCircle, Save, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useApiKeys } from '@/components/api-key-provider';

export default function Settings() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Get API keys from context
  const { 
    openaiKey, setOpenaiKey,
    deepgramKey, setDeepgramKey,
    geminiKey, setGeminiKey
  } = useApiKeys();
  
  // State for masked inputs
  const [openaiKeyMasked, setOpenaiKeyMasked] = useState(true);
  const [deepgramKeyMasked, setDeepgramKeyMasked] = useState(true);
  const [geminiKeyMasked, setGeminiKeyMasked] = useState(true);
  
  // Save the API keys (the context provider will handle localStorage saving)
  const handleSaveKeys = () => {
    toast({
      title: "API keys saved",
      description: "Your API keys have been saved and are ready to use",
    });
  };
  
  // Handle copying the instructions
  const handleCopyInstructions = () => {
    const instructions = `
To use this app, you need to obtain the following API keys:

1. OpenAI API Key: https://platform.openai.com/
2. Deepgram API Key: https://console.deepgram.com/
3. Google Gemini API Key: https://aistudio.google.com/

Please note that these services may charge fees based on usage.
    `.trim();
    
    navigator.clipboard.writeText(instructions)
      .then(() => {
        toast({
          title: "Instructions copied",
          description: "API key instructions have been copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Failed to copy instructions",
          variant: "destructive"
        });
      });
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
              <div className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group cursor-pointer`}>
                <Plus className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary" />
                New Transcription
              </div>
            </Link>
            
            <Link href="/saved-transcripts">
              <div className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/saved-transcripts' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group cursor-pointer`}>
                <Layers className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary" />
                Saved Transcripts
              </div>
            </Link>
            
            <Link href="/settings">
              <div className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/settings' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group cursor-pointer`}>
                <SettingsIcon className="h-5 w-5 mr-3 text-primary" />
                Settings
              </div>
            </Link>
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
            <h2 className="text-2xl font-semibold text-white">Settings</h2>
            <p className="text-gray-400">Configure your API keys and preferences</p>
          </div>

          <Card className="bg-gray-800 border-none shadow-lg mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <KeyRound className="h-5 w-5 mr-2 text-primary" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Enter your API keys below to enable full functionality. Your keys are stored locally in your browser.
              </p>
              
              <div className="space-y-4">
                {/* OpenAI API Key */}
                <div>
                  <label htmlFor="openai-key" className="block text-sm font-medium text-gray-300 mb-1">
                    OpenAI API Key (for Whisper)
                  </label>
                  <div className="flex">
                    <Input
                      id="openai-key"
                      type={openaiKeyMasked ? "password" : "text"}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-2 bg-gray-700 border-gray-600 text-gray-300"
                      onClick={() => setOpenaiKeyMasked(!openaiKeyMasked)}
                    >
                      {openaiKeyMasked ? "Show" : "Hide"}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Used for transcribing audio with OpenAI's Whisper models
                  </p>
                </div>
                
                {/* Deepgram API Key */}
                <div>
                  <label htmlFor="deepgram-key" className="block text-sm font-medium text-gray-300 mb-1">
                    Deepgram API Key
                  </label>
                  <div className="flex">
                    <Input
                      id="deepgram-key"
                      type={deepgramKeyMasked ? "password" : "text"}
                      value={deepgramKey}
                      onChange={(e) => setDeepgramKey(e.target.value)}
                      placeholder="YOUR_DEEPGRAM_API_KEY"
                      className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-2 bg-gray-700 border-gray-600 text-gray-300"
                      onClick={() => setDeepgramKeyMasked(!deepgramKeyMasked)}
                    >
                      {deepgramKeyMasked ? "Show" : "Hide"}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Used for transcribing audio with Deepgram's models
                  </p>
                </div>
                
                {/* Gemini API Key */}
                <div>
                  <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-300 mb-1">
                    Google Gemini API Key
                  </label>
                  <div className="flex">
                    <Input
                      id="gemini-key"
                      type={geminiKeyMasked ? "password" : "text"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="YOUR_GEMINI_API_KEY"
                      className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-2 bg-gray-700 border-gray-600 text-gray-300"
                      onClick={() => setGeminiKeyMasked(!geminiKeyMasked)}
                    >
                      {geminiKeyMasked ? "Show" : "Hide"}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Used for analyzing transcripts with Google's Gemini AI
                  </p>
                </div>
                
                <div className="flex pt-4">
                  <Button onClick={handleSaveKeys} className="mr-2">
                    <Save className="h-4 w-4 mr-2" />
                    Save API Keys
                  </Button>
                  <Button variant="outline" onClick={handleCopyInstructions}>
                    Copy API Instructions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}