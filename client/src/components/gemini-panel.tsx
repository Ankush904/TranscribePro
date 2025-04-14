import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Transcript, GeminiConfig } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GeminiPanelProps {
  transcript: Transcript;
  onClose: () => void;
}

export default function GeminiPanel({ transcript, onClose }: GeminiPanelProps) {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: "I'm Gemini, an AI assistant. I can help analyze this transcript for you. You can ask me to summarize key points, extract specific information, or answer questions about the content."
    }
  ]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<GeminiConfig>({
    temperature: 0.2,
    maxTokens: 1000
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!question.trim()) return;
    
    // Add user message
    const userMessage: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setQuestion('');
    setIsLoading(true);
    
    try {
      // Make API request to Gemini
      const response = await apiRequest('POST', '/api/gemini/analyze', {
        transcript: transcript.text,
        question: userMessage.content,
        config
      });
      
      const data = await response.json();
      
      // Add Gemini response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (error) {
      toast({
        title: "Gemini analysis failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error while processing your question. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <Card className="bg-gray-800 border-none shadow-lg">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium text-white flex items-center">
          <HelpCircle className="h-5 w-5 mr-2 text-purple-500" />
          Ask Questions with Gemini
        </CardTitle>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 text-sm mb-4">
          Use Gemini 2.0 Flash to analyze your transcript, extract insights, or answer questions about the content.
        </p>
        
        {/* Chat Messages */}
        <div className="mb-4 h-64 overflow-y-auto px-1 space-y-4" id="gemini-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex items-start ${message.role === 'user' ? 'justify-end' : ''} space-x-3`}
            >
              {message.role !== 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-white" />
                </div>
              )}
              
              <div 
                className={`rounded-lg px-4 py-2 text-sm max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-purple-600/20 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 max-w-[85%]">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Question Input */}
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Input
            type="text"
            id="gemini-question"
            placeholder="Ask a question about the transcript..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500"
          />
          
          <Button 
            type="submit" 
            disabled={isLoading || !question.trim()}
            variant="secondary"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        
        {/* Gemini Config */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="gemini-temperature" className="block text-xs font-medium text-gray-300 mb-1">
              Temperature: {config.temperature}
            </label>
            <Slider
              id="gemini-temperature"
              min={0}
              max={1}
              step={0.1}
              value={[config.temperature]}
              onValueChange={(values) => setConfig({...config, temperature: values[0]})}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="gemini-max-tokens" className="block text-xs font-medium text-gray-300 mb-1">
              Max Tokens: {config.maxTokens}
            </label>
            <Slider
              id="gemini-max-tokens"
              min={100}
              max={2000}
              step={100}
              value={[config.maxTokens]}
              onValueChange={(values) => setConfig({...config, maxTokens: values[0]})}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
