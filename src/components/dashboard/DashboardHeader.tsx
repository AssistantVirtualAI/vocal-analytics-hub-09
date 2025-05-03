
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  lastUpdated: string;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function DashboardHeader({ lastUpdated, isLoading, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
      <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">
          Dernière synchronisation: {lastUpdated}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Chargement...' : 'Actualiser'}
        </Button>
      </div>
    </div>
  );
}
