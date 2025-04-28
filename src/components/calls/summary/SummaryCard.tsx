
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

interface SummaryCardProps {
  summary?: string;
  hasTranscript: boolean;
  callId?: string;
}

export const SummaryCard = ({ summary, hasTranscript, callId }: SummaryCardProps) => {
  const { mutate: generateSummary, isPending } = useGenerateSummary();
  const { toast } = useToast();

  // Only show the generate button if we have a transcript but no summary
  const showGenerateButton = !summary && hasTranscript && !!callId;

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
            <Button 
              variant="outline" 
              size="sm"
              disabled={isPending}
              onClick={handleGenerateSummary}
            >
              {isPending ? "Génération..." : "Générer un résumé"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {summary ? (
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
