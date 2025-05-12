
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
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const MAX_RETRIES = 3;

  const handleRetry = async () => {
    if (!onRetry) return;
    
    if (retryCount >= MAX_RETRIES) {
      toast({
        title: "Limite de tentatives atteinte",
        description: "Impossible de récupérer l'audio après plusieurs tentatives. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
      return;
    }
    
    setRetrying(true);
    setRetryCount(prevCount => prevCount + 1);
    
    toast({
      title: "Nouvelle tentative",
      description: `Récupération de l'audio depuis ElevenLabs... (tentative ${retryCount + 1}/${MAX_RETRIES})`,
    });
    
    try {
      await onRetry();
      // If successful, reset retry count
      setRetryCount(0);
    } catch (err) {
      console.error("Error retrying audio load:", err);
      
      // Show different toast based on retry count
      if (retryCount >= MAX_RETRIES - 1) {
        toast({
          title: "Échec des tentatives",
          description: "Impossible de récupérer l'audio après plusieurs essais. Veuillez réessayer plus tard.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Échec de la tentative",
          description: "Impossible de récupérer l'audio. Nouvelle tentative dans quelques secondes.",
          variant: "destructive"
        });
        
        // Auto-retry with exponential backoff
        const timeout = setTimeout(() => {
          handleRetry();
        }, Math.min(2000 * Math.pow(2, retryCount), 30000)); // Cap at 30 seconds
        
        return () => clearTimeout(timeout);
      }
    } finally {
      setRetrying(false);
    }
  };

  // Process audioUrl to ensure it works with our new proxy function
  const processedAudioUrl = audioUrl?.includes('history_id=') 
    ? audioUrl // Already using our proxy function
    : audioUrl?.includes('/history/') && callId 
      ? `/api/functions/v1/get-call-audio?history_id=${callId}` // Convert ElevenLabs direct URL to our proxy
      : audioUrl; // Keep as is if it doesn't match any pattern

  return (
    <Card>
      <PlayerHeader isLoading={isLoading} error={error} retryCount={retryCount} />
      <CardContent>
        <PlayerControls 
          audioUrl={processedAudioUrl}
          isLoading={isLoading}
          error={error}
          callId={callId}
          onRetry={handleRetry}
          isRetrying={retrying}
          retryCount={retryCount}
          maxRetries={MAX_RETRIES}
        />
        
        {transcript && <TranscriptPreview transcript={transcript} />}
      </CardContent>
    </Card>
  );
};
