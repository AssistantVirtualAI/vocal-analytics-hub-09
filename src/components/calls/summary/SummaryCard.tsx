
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGenerateSummary } from '@/hooks/useGenerateSummary';
import { useToast } from '@/hooks/use-toast';
import { SummaryAudioPlayer } from './SummaryAudioPlayer';
import { SummaryGenerationButtons } from './SummaryGenerationButtons';
import { SummaryContent } from './SummaryContent';

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
  const { toast } = useToast();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé de l'appel</CardTitle>
        {showGenerateButton && (
          <div className="flex justify-between items-center">
            <CardDescription>Aucun résumé disponible</CardDescription>
            <SummaryGenerationButtons 
              onGenerate={handleGenerateSummary}
              isPending={isPending}
              onGenerateFallback={showFallbackButton ? onGenerateFallbackSummary : undefined}
              isFallbackGenerating={isFallbackGenerating}
            />
          </div>
        )}
        {summary && (
          <div className="flex justify-end">
            <SummaryAudioPlayer summary={summary} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <SummaryContent 
          isLoading={isLoading} 
          summary={summary} 
          hasTranscript={hasTranscript} 
        />
      </CardContent>
    </Card>
  );
};
