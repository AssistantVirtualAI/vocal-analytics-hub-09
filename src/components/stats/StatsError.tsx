
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Info } from "lucide-react";
import { useState } from "react";

interface StatsErrorProps {
  onRetry: () => void;
  message?: string;
  details?: string;
}

export function StatsError({ onRetry, message, details }: StatsErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setTimeout(() => setIsRetrying(false), 1000); // Keep animation visible for a moment
    }
  };

  return (
    <Alert 
      variant="destructive" 
      className="my-4 border-red-200/70 dark:border-red-900/30 bg-red-50/70 dark:bg-red-950/20 backdrop-blur-sm animate-in fade-in duration-300 shadow-md"
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <AlertDescription className="font-medium text-base">
          {message || "Erreur lors du chargement des données. Veuillez réessayer ultérieurement."}
        </AlertDescription>
      </div>
      
      {details && (
        <div className="mt-3 p-3 rounded-md bg-red-100/50 dark:bg-red-900/20 flex items-start space-x-2">
          <Info className="h-4 w-4 mt-0.5 text-red-600/70 dark:text-red-400/70 flex-shrink-0" />
          <span className="text-sm text-red-700/80 dark:text-red-300/80">{details}</span>
        </div>
      )}
      
      <div className="mt-3 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          disabled={isRetrying}
          className={`
            gap-1.5 border-red-200/70 dark:border-red-800/40 
            hover:bg-red-100/50 dark:hover:bg-red-900/20 
            transition-all duration-200 transform active:scale-95
            ${isRetrying ? 'opacity-80' : ''}
          `}
        >
          <RefreshCw 
            className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : 'animate-pulse'}`} 
          />
          {isRetrying ? "Chargement..." : "Réessayer"}
        </Button>
      </div>
    </Alert>
  );
}
