
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Wifi } from "lucide-react";
import { StatsError } from "./StatsError";

interface DataLoadingErrorProps {
  onRetry: () => void;
  title?: string;
  message?: string;
  showConnectivity?: boolean;
}

export function DataLoadingError({
  onRetry,
  title = "Erreur de chargement des statistiques",
  message = "Impossible de récupérer les données des appels.",
  showConnectivity = true
}: DataLoadingErrorProps) {
  
  return (
    <Card className="border-red-200/40 dark:border-red-900/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-100/80 dark:bg-red-900/20 flex items-center justify-center animate-bounce-small">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {message}
            </p>
          </div>
          
          {showConnectivity && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground border-t border-b border-border/30 py-2 px-4">
              <Wifi className="h-4 w-4" />
              <span>Veuillez vérifier votre connexion internet et réessayer</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="justify-center pb-6">
        <Button 
          onClick={onRetry} 
          variant="outline"
          className="border-red-200 hover:border-red-300 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </CardFooter>
    </Card>
  );
}
