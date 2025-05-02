
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RetryButtonProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export const RetryButton = ({ onRetry, isRetrying }: RetryButtonProps) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onRetry}
      disabled={isRetrying}
      aria-label="Réessayer le chargement de l'audio"
      title="Réessayer le chargement de l'audio"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
      Réessayer
    </Button>
  );
};
