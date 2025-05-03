
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DataWrapperProps {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
  refetch?: () => void;
}

export function DataWrapper({ isLoading, error, children, refetch }: DataWrapperProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Erreur lors du chargement des données.</p>
        {refetch && (
          <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
            Réessayer
          </Button>
        )}
      </div>
    );
  }
  
  return <>{children}</>;
}
