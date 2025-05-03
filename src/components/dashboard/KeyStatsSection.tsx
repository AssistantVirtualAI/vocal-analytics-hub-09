
import { Phone, Clock, Star } from "lucide-react";
import { StatCard } from "@/components/stats/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CallStats } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface KeyStatsSectionProps {
  statsData: CallStats | undefined;
  isStatsLoading: boolean;
  statsError: Error | null;
  formatDurationMinutes: (seconds: number) => string;
}

export function KeyStatsSection({ 
  statsData, 
  isStatsLoading, 
  statsError,
  formatDurationMinutes 
}: KeyStatsSectionProps) {
  if (statsError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des statistiques: {statsError.message}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total des appels"
        value={isStatsLoading ? <Skeleton className="h-8 w-16" /> : statsData?.totalCalls || 0}
        icon={Phone}
        isLoading={isStatsLoading}
      />
      <StatCard
        title="Durée moyenne"
        value={isStatsLoading ? <Skeleton className="h-8 w-16" /> : formatDurationMinutes(statsData?.avgDuration || 0)}
        icon={Clock}
        isLoading={isStatsLoading}
      />
      <StatCard
        title="Satisfaction moyenne"
        value={isStatsLoading ? <Skeleton className="h-8 w-16" /> : `${(statsData?.avgSatisfaction || 0).toFixed(1)}/5`}
        icon={Star}
        isLoading={isStatsLoading}
      />
    </div>
  );
}
