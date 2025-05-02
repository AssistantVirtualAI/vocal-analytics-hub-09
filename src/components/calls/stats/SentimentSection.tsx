
import { Badge } from '@/components/ui/badge';
import { getSentimentBadgeVariant } from './statsUtils';

interface SentimentProps {
  sentiment?: {
    label?: string;
    score?: number;
  };
}

/**
 * Displays sentiment analysis information if available
 */
export const SentimentSection = ({ sentiment }: SentimentProps) => {
  if (!sentiment || typeof sentiment !== 'object') {
    return null;
  }

  const { label, score } = sentiment;
  const badgeVariant = getSentimentBadgeVariant(label);
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Analyse de Sentiment</h3>
      <div className="flex items-center space-x-2">
        {label && (
          <Badge variant={badgeVariant}>
            {label.charAt(0).toUpperCase() + label.slice(1)}
          </Badge>
        )}
        {score !== undefined && (
          <span className="text-sm text-muted-foreground">
            (Score: {score.toFixed(2)})
          </span>
        )}
      </div>
    </div>
  );
};
