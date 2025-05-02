
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { TranscriptPreview } from './audio/TranscriptPreview';
import { PlayerHeader } from './audio/PlayerHeader';
import { PlayerControls } from './audio/PlayerControls';

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
  const [retrying, setRetrying] = useState(false);
  const { toast } = useToast();

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setRetrying(true);
    toast({
      title: "Nouvelle tentative",
      description: "Récupération de l'audio depuis ElevenLabs...",
    });
    
    try {
      await onRetry();
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

  return (
    <Card>
      <PlayerHeader isLoading={isLoading} error={error} />
      <CardContent>
        <PlayerControls 
          audioUrl={audioUrl}
          isLoading={isLoading}
          error={error}
          callId={callId}
          onRetry={handleRetry}
          isRetrying={retrying}
        />
        
        {transcript && <TranscriptPreview transcript={transcript} />}
      </CardContent>
    </Card>
  );
};
