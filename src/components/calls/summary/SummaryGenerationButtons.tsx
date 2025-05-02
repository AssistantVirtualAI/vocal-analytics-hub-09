
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Sparkles } from 'lucide-react';

interface SummaryGenerationButtonsProps {
  onGenerate: () => void;
  isPending: boolean;
  onGenerateFallback?: () => void;
  isFallbackGenerating?: boolean;
  onGenerateAnthropic?: () => void;
  isAnthropicGenerating?: boolean;
}

export const SummaryGenerationButtons = ({
  onGenerate,
  isPending,
  onGenerateFallback,
  isFallbackGenerating = false,
  onGenerateAnthropic,
  isAnthropicGenerating = false
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
          GPT Alternatif
        </Button>
      )}
      
      {onGenerateAnthropic && (
        <Button 
          variant="outline" 
          size="sm"
          disabled={isAnthropicGenerating}
          onClick={onGenerateAnthropic}
          title="Utiliser Claude AI pour générer un résumé"
        >
          {isAnthropicGenerating ? (
            <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Claude AI
        </Button>
      )}
    </div>
  );
};
