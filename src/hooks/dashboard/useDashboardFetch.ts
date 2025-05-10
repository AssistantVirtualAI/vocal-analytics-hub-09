
import { useState, useEffect, useCallback } from 'react';
import { useCallsList } from '@/hooks/useCallsList';
import { useCallStats } from '@/hooks/useCallStats';
import type { Call, CallStats } from '@/types';

interface CallsData {
  calls: Call[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function useDashboardFetch() {
  const [callStats, setCallStats] = useState<CallStats>({
    totalCalls: 0,
    avgDuration: 0,
    avgSatisfaction: 0,
    callsPerDay: {},
    lastUpdated: new Date().toISOString(),
    topCustomers: []
  });
  
  const [callsData, setCallsData] = useState<CallsData>({
    calls: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  });
  
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Fetch call statistics
  const { data: statsData, isLoading: isStatsLoading, isError: isStatsError, refetch: refetchStats } = useCallStats();

  // Fetch call list
  const { data: callsListData, isLoading: isCallsLoading, isError: isCallsError, refetch: refetchCalls } = useCallsList();

  // Update states when data is available
  useEffect(() => {
    if (statsData) {
      setCallStats(statsData);
    }
    
    if (callsListData) {
      setCallsData(callsListData);
    }
    
    if (!isStatsLoading && !isCallsLoading) {
      setIsLoading(false);
      setLastUpdated(new Date().toISOString());
    }
    
    setHasError(isStatsError || isCallsError);
  }, [statsData, callsListData, isStatsLoading, isCallsLoading, isStatsError, isCallsError]);

  // Function to manually refresh data
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      await Promise.all([
        refetchStats(),
        refetchCalls()
      ]);
      
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [refetchStats, refetchCalls]);

  return {
    callStats,
    callsData,
    isLoading,
    hasError,
    handleRefresh,
    lastUpdated
  };
}
