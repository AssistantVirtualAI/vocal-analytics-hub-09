
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface RetryButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export const RetryButton = ({ 
  onClick, 
  isDisabled = false,
  retryCount = 0,
  maxRetries = 3
}: RetryButtonProps) => {
  const remainingAttempts = maxRetries - retryCount;
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isDisabled}
      className="flex items-center space-x-2"
    >
      <RotateCcw className="h-4 w-4 mr-1" />
      <span>
        Réessayer
        {remainingAttempts > 0 && ` (${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''})`}
      </span>
    </Button>
  );
};

