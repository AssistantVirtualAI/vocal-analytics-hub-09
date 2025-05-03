
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface StatsErrorProps {
  onRetry: () => void;
}

export function StatsError({ onRetry }: StatsErrorProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Erreur lors du chargement des statistiques. Veuillez réessayer ultérieurement.
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
