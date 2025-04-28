
import { Clock, Phone, Star } from "lucide-react";
import { StatCard } from "./StatCard";

interface StatsOverviewProps {
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
}

export function StatsOverview({ totalCalls, avgDuration, avgSatisfaction }: StatsOverviewProps) {
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
        trend={{
          value: Math.floor(totalCalls * 0.2),
          label: "depuis le mois dernier"
        }}
      />
      <StatCard
        title="Durée moyenne"
        value={formatDuration(Math.round(avgDuration))}
        icon={Clock}
        trend={{
          value: -20,
          label: "secondes depuis le mois dernier"
        }}
      />
      <StatCard
        title="Satisfaction moyenne"
        value={`${avgSatisfaction.toFixed(1)}/5`}
        icon={Star}
        trend={{
          value: 0.2,
          label: "depuis le mois dernier"
        }}
      />
    </div>
  );
}
