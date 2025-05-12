
import { useMemo } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useCallsPerDay } from '@/hooks/useCallsPerDay';
import { TimeRange } from '@/components/dashboard/TimeRangeSelector';

interface UseChartDataOptions {
  orgSlug?: string;
  dateRange?: DateRange;
  enabled?: boolean;
  timeRange?: TimeRange;
}

export function useChartData({ orgSlug, dateRange, enabled = true, timeRange = '14d' }: UseChartDataOptions = {}) {
  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  // Pass the timeRange to the useCallsPerDay hook
  const { 
    data: callsPerDayData, 
    isLoading, 
    error, 
    refetch 
  } = useCallsPerDay(
    14,
    !!orgSlug && enabled,
    orgSlug,
    startDate,
    endDate,
    timeRange
  );

  // Format chart data for display
  const chartData = useMemo(() => {
    if (!callsPerDayData) return [];
    
    return Object.entries(callsPerDayData)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        appels: typeof count === 'number' ? count : 0,
      }));
  }, [callsPerDayData]);

  return {
    chartData,
    isLoading,
    error,
    refetch,
  };
}
