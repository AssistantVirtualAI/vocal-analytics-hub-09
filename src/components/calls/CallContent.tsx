
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

interface CallContentProps {
  summary?: string;
  transcript?: string;
  callId?: string;
}

export const CallContent = ({ summary, transcript, callId }: CallContentProps) => {
  const { mutate: generateSummary, isPending } = useGenerateSummary();
  const { toast } = useToast();

  // Only show the generate button if we have a transcript but no summary
  const showGenerateButton = !summary && !!transcript && !!callId;

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
    <div className="space-y-6">
      {/* Summary Card */}
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
              {transcript 
                ? "Cliquez sur \"Générer un résumé\" pour créer un résumé à partir de la transcription."
                : "Aucun résumé ou transcription disponible pour cet appel."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transcript Card */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <p className="whitespace-pre-line">{transcript}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
