
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ElevenLabsAudioPlayerProps {
  callId: string | undefined;
  isLoading: boolean;
  audioUrl?: string;
  error?: Error | null;
  transcript?: string;
  onRetry?: () => void;
}

export const ElevenLabsAudioPlayer = ({ 
  callId, 
  isLoading, 
  audioUrl,
  error,
  transcript,
  onRetry
}: ElevenLabsAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [retrying, setRetrying] = useState(false);
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
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: ErrorEvent) => {
      console.error("Audio error:", e);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire l'audio. Veuillez réessayer.",
        variant: "destructive"
      });
      setIsPlaying(false);
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
  }, [toast]);

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

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setRetrying(true);
    toast({
      title: "Nouvelle tentative",
      description: "Récupération de l'audio depuis ElevenLabs...",
    });
    
    try {
      await onRetry();
      
      // Force a retry by updating the audio element
      const audio = audioRef.current;
      if (audio && audioUrl) {
        audio.load();
        setCurrentTime(0);
        setDuration(0);
      }
    } catch (err) {
      console.error("Error retrying audio load:", err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer l'audio. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrement audio ElevenLabs</CardTitle>
        {isLoading && (
          <CardDescription>Chargement de l'audio depuis ElevenLabs...</CardDescription>
        )}
        {error && (
          <CardDescription className="text-red-500">
            Erreur lors du chargement de l'audio: {error.message || 'Erreur inconnue'}
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
              disabled={isLoading || !audioUrl}
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
                disabled={isLoading || !audioUrl}
              />
              <div className="flex justify-between mt-1 text-xs">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
            {error && onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                disabled={retrying}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                Réessayer
              </Button>
            )}
          </div>
          {audioUrl && <audio ref={audioRef} src={audioUrl} />}
        </div>
        
        {transcript && (
          <div className="mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium mb-2">Transcription ElevenLabs</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Voir tout</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Transcription complète</DialogTitle>
                    <DialogDescription>
                      Transcription générée par ElevenLabs
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto mt-4">
                    <p className="whitespace-pre-wrap">{transcript}</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="text-sm bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
              {transcript}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
