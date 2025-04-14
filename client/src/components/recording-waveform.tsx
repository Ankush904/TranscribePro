import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RecordingWaveformProps {
  isRecording: boolean;
  className?: string;
}

export default function RecordingWaveform({ isRecording, className }: RecordingWaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  
  // Initialize and animate waveform bars
  useEffect(() => {
    if (!waveformRef.current) return;
    
    const bars = waveformRef.current.querySelectorAll('.waveform-bar');
    
    // Set random initial heights
    bars.forEach(bar => {
      const height = Math.floor(Math.random() * 40) + 15;
      (bar as HTMLElement).style.height = `${height}%`;
    });
    
    // Animate bars when recording
    if (isRecording) {
      const animateBars = () => {
        bars.forEach(bar => {
          const height = isRecording ? Math.floor(Math.random() * 60) + 20 : 30;
          (bar as HTMLElement).style.height = `${height}%`;
        });
      };
      
      const interval = setInterval(animateBars, 100);
      return () => clearInterval(interval);
    }
  }, [isRecording]);
  
  return (
    <div 
      ref={waveformRef}
      className={cn(
        "relative h-16 bg-gray-700 rounded-md overflow-hidden",
        isRecording && "recording",
        className
      )}
    >
      <div className="waveform-bars flex items-center justify-between h-full px-3">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className={`waveform-bar w-0.5 bg-primary rounded-sm transition-all duration-100 ${isRecording ? 'animate-pulse' : ''}`}
            style={{ height: '30%' }}
          />
        ))}
      </div>
    </div>
  );
}
