
import { useState } from 'react';
import { useDashboardFetch } from '@/hooks/dashboard/useDashboardFetch';
import { useLastUpdated } from '@/hooks/dashboard/useLastUpdated';
import { useChartData } from '@/hooks/dashboard/useChartData';
import { useRecentCalls } from '@/hooks/dashboard/useRecentCalls';
import { useToastNotification } from '@/hooks/dashboard/useToastNotification';

export function useDashboardStats() {
  const { 
    callStats, 
    customerStats, 
    callsData, 
    isLoading, 
    hasError, 
    handleRefresh 
  } = useDashboardFetch();
  
  const hasData = !!(callStats || customerStats || callsData);
  
  const { lastUpdated, setLastUpdated } = useLastUpdated(isLoading, hasError, hasData);
  const { chartData } = useChartData(callStats);
  const { recentCalls } = useRecentCalls(callsData);
  const { showSuccessToast, showErrorToast } = useToastNotification();

  // Handle manual refresh
  const handleRefreshWithToast = async () => {
    try {
      await handleRefresh();
      setLastUpdated(new Date());
      showSuccessToast();
    } catch (error) {
      showErrorToast();
    }
  };

  return {
    callStats,
    customerStats,
    recentCalls,
    chartData,
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh: handleRefreshWithToast
  };
}
