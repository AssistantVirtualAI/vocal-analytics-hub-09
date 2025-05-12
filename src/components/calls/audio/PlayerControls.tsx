import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { formatTime } from '@/utils/formatters';
import { RetryButton } from './RetryButton';

interface PlayerControlsProps {
  audioUrl?: string;
  isLoading: boolean;
  error?: Error | null;
  callId?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export function PlayerControls({
  audioUrl,
  isLoading,
  error,
  callId,
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3
}: PlayerControlsProps) {
  // Process audioUrl to ensure it works with our new proxy function
  const effectiveAudioUrl = audioUrl?.includes('history_id=') 
    ? audioUrl // Already using our proxy function
    : audioUrl?.includes('/history/') && callId 
      ? `/api/functions/v1/get-call-audio?history_id=${callId}` // Convert ElevenLabs direct URL to our proxy
      : audioUrl; // Keep as is if it doesn't match any pattern
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.75);

  useEffect(() => {
    if (effectiveAudioUrl) {
      const audio = new Audio(effectiveAudioUrl);
      audioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        audio.currentTime = 0;
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio loading error:', e);
        setIsPlaying(false);
      });
      
      // Set initial volume
      audio.volume = volume;
      
      return () => {
        audio.pause();
        audio.src = '';
        audio.removeEventListener('loadedmetadata', () => {});
        audio.removeEventListener('timeupdate', () => {});
        audio.removeEventListener('ended', () => {});
        audio.removeEventListener('error', () => {});
        audioRef.current = null;
      };
    }
  }, [effectiveAudioUrl]);
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };
  
  if (isLoading || isRetrying) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="animate-pulse h-4 w-4/5 bg-gray-200 rounded-full"></div>
        <div className="animate-pulse h-10 w-10 rounded-full bg-gray-200"></div>
        <div className="text-sm text-gray-500">
          {isRetrying 
            ? `Nouvelle tentative (${retryCount}/${maxRetries})...` 
            : 'Chargement de l\'audio...'}
        </div>
      </div>
    );
  }
  
  if (error || !effectiveAudioUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <p className="text-center text-sm text-gray-500">
          {error ? 'Une erreur est survenue lors du chargement de l\'audio.' : 'Aucun audio disponible.'}
        </p>
        {onRetry && (
          <RetryButton 
            onClick={onRetry} 
            isDisabled={retryCount >= maxRetries}
            retryCount={retryCount}
            maxRetries={maxRetries}
          />
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayback}
          className="h-10 w-10 rounded-full"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <div className="flex-1 flex flex-col">
          <div className="w-full">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSliderChange}
              className="cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Volume2 className="h-4 w-4 text-gray-500" />
        <Slider
          value={[volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-24 cursor-pointer"
        />
        
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying || retryCount >= maxRetries}
            className="ml-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Recharger
          </Button>
        )}
      </div>
    </div>
  );
}
