
import { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AudioPlayerControlsProps {
  audioUrl?: string;
  isDisabled?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
  ariaLabel?: string;
}

export const AudioPlayerControls = ({ 
  audioUrl, 
  isDisabled = false,
  onPlayStateChange,
  ariaLabel = "Contrôles audio"
}: AudioPlayerControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };
    const handleError = (e: ErrorEvent) => {
      console.error("Audio error:", e);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire l'audio. Veuillez réessayer.",
        variant: "destructive"
      });
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', handleDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', handleDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
    };
  }, [toast, onPlayStateChange]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      audio.play().catch(error => {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'audio. Veuillez réessayer.",
          variant: "destructive"
        });
        console.error("Audio playback error:", error);
      });
      setIsPlaying(true);
      if (onPlayStateChange) onPlayStateChange(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-secondary rounded-md p-4" role="region" aria-label={ariaLabel}>
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
          onClick={togglePlayback}
          disabled={isDisabled || !audioUrl}
          aria-label={isPlaying ? "Mettre en pause" : "Lire l'audio"}
          title={isPlaying ? "Mettre en pause" : "Lire l'audio"}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-primary cursor-pointer"
            disabled={isDisabled || !audioUrl}
            aria-label="Position de lecture audio"
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            aria-valuenow={currentTime}
            aria-valuetext={`${formatDuration(currentTime)} sur ${formatDuration(duration)}`}
            style={{
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progressPercentage}%, var(--secondary-foreground) ${progressPercentage}%, var(--secondary-foreground) 100%)`
            }}
          />
          <div className="flex justify-between mt-1 text-xs">
            <span aria-hidden="true">{formatDuration(currentTime)}</span>
            <span aria-hidden="true">{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
    </div>
  );
};
