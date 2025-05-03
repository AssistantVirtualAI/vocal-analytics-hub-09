
import { Phone, Clock, Star } from "lucide-react";
import { StatCard } from "@/components/stats/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CallStats } from "@/types";

interface KeyStatsSectionProps {
  statsData: CallStats | undefined;
  isStatsLoading: boolean;
  formatDurationMinutes: (seconds: number) => string;
}

export function KeyStatsSection({ 
  statsData, 
  isStatsLoading, 
  formatDurationMinutes 
}: KeyStatsSectionProps) {
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
