
import { DataWrapper } from "./DataWrapper";
import { StatCard } from "./StatCard";
import { BarChart2, Clock, Phone, Star } from "lucide-react";
import { formatDuration } from "@/utils/formatters";

interface StatsOverviewProps {
  data: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function StatsOverview({ data: statsData, isLoading, error, refetch }: StatsOverviewProps) {
  return (
    <DataWrapper isLoading={isLoading} error={error} refetch={refetch}>
      {statsData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total des appels"
            value={statsData.totalCalls ?? 0}
            icon={Phone}
          />
          <StatCard
            title="Durée moyenne"
            value={formatDuration(statsData.avgDuration ?? 0)}
            icon={Clock}
          />
          <StatCard
            title="Satisfaction moyenne"
            value={`${(statsData.avgSatisfaction ?? 0).toFixed(1)}/5`}
            icon={Star}
          />
          <StatCard
            title="Appels / jour (moy)"
            value={statsData.avgCallsPerDay ? statsData.avgCallsPerDay.toFixed(1) : "N/A"}
            icon={BarChart2}
          />
        </div>
      )}
    </DataWrapper>
  );
}
