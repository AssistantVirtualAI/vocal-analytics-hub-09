
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AudioPlayerControls } from './audio/AudioPlayerControls';
import { RetryButton } from './audio/RetryButton';
import { TranscriptPreview } from './audio/TranscriptPreview';
import { DownloadButton } from './audio/DownloadButton';

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
        <div className="flex items-center justify-between mb-4">
          <AudioPlayerControls 
            audioUrl={audioUrl} 
            isDisabled={isLoading}
            ariaLabel="Contrôles de lecture audio ElevenLabs"
          />
          <div className="flex gap-2">
            {error && onRetry && (
              <RetryButton onRetry={handleRetry} isRetrying={retrying} />
            )}
            {audioUrl && !isLoading && (
              <DownloadButton audioUrl={audioUrl} callId={callId} />
            )}
          </div>
        </div>
        
        {transcript && <TranscriptPreview transcript={transcript} />}
      </CardContent>
    </Card>
  );
};
