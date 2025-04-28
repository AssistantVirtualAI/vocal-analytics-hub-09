
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Play, Pause } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Call } from '@/types';

interface CallItemProps {
  call: Call;
}

export function CallItem({ call }: CallItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!audioElement) {
      const audio = new Audio(call.audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Date</div>
            <div>{format(new Date(call.date), 'PPP', { locale: fr })}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Client</div>
            <div className="font-medium">{call.customerName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Agent</div>
            <div>{call.agentName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Durée</div>
            <div>{formatDuration(call.duration)}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-secondary rounded-md p-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>

          {call.summary && (
            <div>
              <div className="text-sm font-medium mb-2">Résumé</div>
              <p className="text-sm text-muted-foreground">{call.summary}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
