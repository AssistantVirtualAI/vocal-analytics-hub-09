
import type { CallStats } from '@/types';

/**
 * Hook to transform call statistics into chart data format
 */
export function useChartData(callStats: CallStats | undefined) {
  const getChartData = () => {
    if (callStats?.callsPerDay && Object.keys(callStats.callsPerDay).length > 0) {
      return Object.entries(callStats.callsPerDay)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          appels: count,
        }))
        .slice(-10); // Last 10 days
    }
    return [];
  };

  return {
    chartData: getChartData()
  };
}
