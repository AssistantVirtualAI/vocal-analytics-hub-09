
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { CallsChart } from "@/components/dashboard/CallsChart";
import { CallStats } from "@/types";
import { TimeRange } from "./TimeRangeSelector";

interface OverviewTabContentProps {
  statsData?: CallStats;
  isLoadingStats: boolean;
  errorStats: Error | null;
  refetchStats: () => void;
  callsPerDayData: Record<string, number>;
  isLoadingChartData: boolean;
  errorChartData: Error | null;
  refetchChartData: () => void;
  timeRange: TimeRange;
}

export function OverviewTabContent({
  statsData,
  isLoadingStats,
  errorStats,
  refetchStats,
  callsPerDayData,
  isLoadingChartData,
  errorChartData,
  refetchChartData,
  timeRange
}: OverviewTabContentProps) {
  return (
    <>
      <StatsOverview 
        data={statsData} 
        isLoading={isLoadingStats} 
        error={errorStats} 
        refetch={refetchStats} 
      />
      <CallsChart 
        data={callsPerDayData || {}} 
        isLoading={isLoadingChartData} 
        error={errorChartData} 
        refetch={refetchChartData} 
        timeRange={timeRange}
      />
    </>
  );
}
