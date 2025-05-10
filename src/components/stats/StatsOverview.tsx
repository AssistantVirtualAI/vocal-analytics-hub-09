
import { Clock, Phone, Star } from "lucide-react";
import { StatCard } from "./StatCard";
import { CallStats } from "@/types";

interface StatsOverviewProps {
  data?: CallStats;
  isLoading?: boolean;
  error?: Error | null;
  refetch?: () => void;
}

export function StatsOverview({ 
  data, 
  isLoading = false,
  error = null,
  refetch
}: StatsOverviewProps) {
  const totalCalls = data?.totalCalls || 0;
  const avgDuration = data?.avgDuration || 0;
  const avgSatisfaction = data?.avgSatisfaction || 0;

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total des appels"
        value={totalCalls}
        icon={Phone}
        isLoading={isLoading}
        trend={{
          value: Math.floor(totalCalls * 0.2),
          label: "depuis le mois dernier"
        }}
      />
      <StatCard
        title="Durée moyenne"
        value={formatDuration(Math.round(avgDuration))}
        icon={Clock}
        isLoading={isLoading}
        trend={{
          value: -20,
          label: "secondes depuis le mois dernier"
        }}
      />
      <StatCard
        title="Satisfaction moyenne"
        value={`${avgSatisfaction.toFixed(1)}/5`}
        icon={Star}
        isLoading={isLoading}
        trend={{
          value: 0.2,
          label: "depuis le mois dernier"
        }}
      />
    </div>
  );
}
