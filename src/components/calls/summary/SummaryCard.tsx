
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGenerateSummary } from '@/hooks/useGenerateSummary';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { AlertCircle, RefreshCcw, VolumeX, Volume2 } from 'lucide-react';
import { useState } from 'react';

interface SummaryCardProps {
  summary?: string;
  hasTranscript: boolean;
  callId?: string;
  isLoading?: boolean;
  transcript?: string;
  onGenerateFallbackSummary?: () => void;
  isFallbackGenerating?: boolean;
}

export const SummaryCard = ({ 
  summary, 
  hasTranscript, 
  callId, 
  isLoading = false,
  transcript,
  onGenerateFallbackSummary,
  isFallbackGenerating = false
}: SummaryCardProps) => {
  const { mutate: generateSummary, isPending } = useGenerateSummary();
  const { mutate: convertTextToSpeech, isPending: isSpeechGenerating } = useTextToSpeech();
  const { toast } = useToast();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Only show the generate button if we have a transcript but no summary and we're not loading
  const showGenerateButton = !summary && hasTranscript && !!callId && !isLoading;
  // Show fallback button if we have a transcript but failed to get a summary from ElevenLabs
  const showFallbackButton = !summary && hasTranscript && !!callId && !!transcript && !isLoading && !!onGenerateFallbackSummary;

  const handleGenerateSummary = () => {
    if (!callId) return;
    
    generateSummary(callId, {
      onSuccess: () => {
        toast({
          title: "Résumé généré",
          description: "Le résumé de l'appel a été généré avec succès.",
        });
      },
      onError: (error) => {
        toast({
          title: "Erreur",
          description: "Impossible de générer le résumé. " + error.message,
          variant: "destructive",
        });
      },
    });
  };

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
    <Card>
      <CardHeader>
        <CardTitle>Résumé de l'appel</CardTitle>
        {showGenerateButton && (
          <div className="flex justify-between items-center">
            <CardDescription>Aucun résumé disponible</CardDescription>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={isPending}
                onClick={handleGenerateSummary}
              >
                {isPending ? "Génération..." : "Générer un résumé"}
              </Button>
              
              {showFallbackButton && (
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isFallbackGenerating}
                  onClick={onGenerateFallbackSummary}
                  title="Utiliser l'IA pour générer un résumé alternatif"
                >
                  {isFallbackGenerating ? (
                    <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-1" />
                  )}
                  Résumé alternatif
                </Button>
              )}
            </div>
          </div>
        )}
        {summary && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={isSpeechGenerating || (!audioUrl && !summary)}
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
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-4/5"></div>
          </div>
        ) : summary ? (
          <p className="whitespace-pre-line">{summary}</p>
        ) : (
          <p className="text-muted-foreground italic">
            {hasTranscript 
              ? "Cliquez sur \"Générer un résumé\" pour créer un résumé à partir de la transcription."
              : "Aucun résumé ou transcription disponible pour cet appel."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
