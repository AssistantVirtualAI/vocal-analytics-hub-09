
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, VolumeX, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface SummaryAudioPlayerProps {
  summary: string;
}

export const SummaryAudioPlayer = ({ summary }: SummaryAudioPlayerProps) => {
  const { mutate: convertTextToSpeech, isPending: isSpeechGenerating } = useTextToSpeech();
  const { toast } = useToast();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleTextToSpeech = () => {
    if (!summary) return;

    if (audioUrl && audioElement) {
      // If we already have audio, toggle playing/pausing
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
      return;
    }

    // Generate new audio
    convertTextToSpeech(
      { 
        text: summary
      },
      {
        onSuccess: (data) => {
          if (data?.audioContent) {
            // Convert base64 to blob URL
            const base64 = data.audioContent;
            const blob = new Blob(
              [Uint8Array.from(atob(base64), c => c.charCodeAt(0))], 
              { type: 'audio/mpeg' }
            );
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            
            // Create and configure audio element
            const audio = new Audio(url);
            audio.addEventListener('ended', () => setIsPlaying(false));
            audio.addEventListener('pause', () => setIsPlaying(false));
            audio.addEventListener('play', () => setIsPlaying(true));
            setAudioElement(audio);
            
            // Play the audio
            audio.play();
            setIsPlaying(true);
            
            toast({
              title: "Synthèse vocale",
              description: "Le résumé est en cours de lecture audio.",
            });
          } else {
            toast({
              title: "Erreur",
              description: "Impossible de générer l'audio.",
              variant: "destructive",
            });
          }
        },
        onError: (error) => {
          console.error("TTS Error:", error);
          toast({
            title: "Erreur",
            description: "Impossible de générer l'audio. " + error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isSpeechGenerating || !summary}
      onClick={handleTextToSpeech}
      className="flex items-center gap-1"
      title={isPlaying ? "Mettre en pause la lecture" : "Écouter le résumé"}
    >
      {isSpeechGenerating ? (
        <RefreshCcw className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {isSpeechGenerating ? "Génération..." : isPlaying ? "Pause" : "Écouter"}
    </Button>
  );
};
