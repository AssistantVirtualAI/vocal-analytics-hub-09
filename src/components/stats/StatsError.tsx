
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface StatsErrorProps {
  onRetry: () => void;
  message?: string;
}

export function StatsError({ onRetry, message }: StatsErrorProps) {
  return (
    <Alert 
      variant="destructive" 
      className="my-4 border-red-200/70 dark:border-red-900/30 bg-red-50/70 dark:bg-red-950/20 backdrop-blur-sm animate-fade-in"
    >
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <AlertDescription className="font-medium text-base">
          {message || "Erreur lors du chargement des données. Veuillez réessayer ultérieurement."}
        </AlertDescription>
      </div>
      <div className="mt-3 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="gap-1.5 border-red-200/70 dark:border-red-800/40 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-all duration-200 transform active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5 animate-pulse" />
          Réessayer
        </Button>
      </div>
    </Alert>
  );
}
