
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface SummaryGenerationButtonsProps {
  onGenerate: () => void;
  isPending: boolean;
  onGenerateFallback?: () => void;
  isFallbackGenerating?: boolean;
}

export const SummaryGenerationButtons = ({
  onGenerate,
  isPending,
  onGenerateFallback,
  isFallbackGenerating = false
}: SummaryGenerationButtonsProps) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        disabled={isPending}
        onClick={onGenerate}
      >
        {isPending ? "Génération..." : "Générer un résumé"}
      </Button>
      
      {onGenerateFallback && (
        <Button 
          variant="outline" 
          size="sm"
          disabled={isFallbackGenerating}
          onClick={onGenerateFallback}
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
  );
};
