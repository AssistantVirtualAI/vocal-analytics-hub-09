
import { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AudioPlayerProps {
  audioUrl: string;
  isLoading: boolean;
  error?: Error | null;
}

export const AudioPlayer = ({ audioUrl, isLoading, error }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', handleDuration);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', handleDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'audio. Veuillez réessayer.",
          variant: "destructive"
        });
        console.error("Audio playback error:", error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrement audio</CardTitle>
        {isLoading && (
          <CardDescription>Chargement de l'audio depuis ElevenLabs...</CardDescription>
        )}
        {error && (
          <CardDescription className="text-red-500">
            Erreur lors du chargement de l'audio. Utilisation de l'audio par défaut.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="bg-secondary rounded-md p-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
              onClick={togglePlayback}
              disabled={isLoading}
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-secondary-foreground/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(Math.floor(duration))}</span>
              </div>
            </div>
          </div>
          <audio ref={audioRef} src={audioUrl} />
        </div>
      </CardContent>
    </Card>
  );
};
