
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface StatsErrorProps {
  onRetry: () => void;
  message?: string;
}

export function StatsError({ onRetry, message }: StatsErrorProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {message || "Erreur lors du chargement des données. Veuillez réessayer ultérieurement."}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="ml-2"
        >
          Réessayer
        </Button>
      </AlertDescription>
    </Alert>
  );
}
