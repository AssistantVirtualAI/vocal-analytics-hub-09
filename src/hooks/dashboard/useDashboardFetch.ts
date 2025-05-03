
import { useCallStats } from '@/hooks/useCallStats';
import { useCallsList } from '@/hooks/useCallsList';
import { useCustomerStats } from '@/hooks/useCustomerStats';

/**
 * Hook to fetch all dashboard data
 */
export function useDashboardFetch() {
  const { 
    data: callStats, 
    isLoading: callStatsLoading, 
    error: callStatsError,
    refetch: refetchCallStats 
  } = useCallStats();
  
  const {
    data: callsData,
    isLoading: callsLoading,
    error: callsError,
    refetch: refetchCalls
  } = useCallsList({ limit: 5, page: 1 });
  
  const { 
    data: customerStats, 
    isLoading: customerStatsLoading, 
    error: customerStatsError,
    refetch: refetchCustomerStats 
  } = useCustomerStats();

  // Determine loading and error states
  const isLoading = callStatsLoading || customerStatsLoading || callsLoading;
  const hasError = !!(callStatsError || customerStatsError || callsError);
  
  // Function for manual refresh with loading state
  const handleRefresh = async () => {
    try {
      const results = await Promise.all([
        refetchCallStats(),
        refetchCustomerStats(),
        refetchCalls()
      ]);
      return results;
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      throw error; // Re-throw to be caught by the calling function
    }
  };

  return {
    callStats,
    customerStats,
    callsData,
    isLoading,
    hasError,
    handleRefresh
  };
}
