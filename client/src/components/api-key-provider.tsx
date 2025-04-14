import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Define the context shape
interface ApiKeyContextType {
  openaiKey: string;
  deepgramKey: string;
  geminiKey: string;
  setOpenaiKey: (key: string) => void;
  setDeepgramKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
}

// Create the context with default values
const ApiKeyContext = createContext<ApiKeyContextType>({
  openaiKey: '',
  deepgramKey: '',
  geminiKey: '',
  setOpenaiKey: () => {},
  setDeepgramKey: () => {},
  setGeminiKey: () => {},
});

// Provider component
export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedOpenaiKey = localStorage.getItem('OPENAI_API_KEY');
    const savedDeepgramKey = localStorage.getItem('DEEPGRAM_API_KEY');
    const savedGeminiKey = localStorage.getItem('GEMINI_API_KEY');
    
    if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
    if (savedDeepgramKey) setDeepgramKey(savedDeepgramKey);
    if (savedGeminiKey) setGeminiKey(savedGeminiKey);
  }, []);

  // Save API keys to localStorage when they change
  useEffect(() => {
    if (openaiKey) localStorage.setItem('OPENAI_API_KEY', openaiKey);
    if (deepgramKey) localStorage.setItem('DEEPGRAM_API_KEY', deepgramKey);
    if (geminiKey) localStorage.setItem('GEMINI_API_KEY', geminiKey);
  }, [openaiKey, deepgramKey, geminiKey]);

  const value = {
    openaiKey,
    deepgramKey,
    geminiKey,
    setOpenaiKey,
    setDeepgramKey,
    setGeminiKey,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};

// Custom hook to use the API keys context
export const useApiKeys = () => useContext(ApiKeyContext);