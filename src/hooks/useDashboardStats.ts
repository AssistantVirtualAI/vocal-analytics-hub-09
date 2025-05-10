
import { useState } from 'react';
import { useDashboardFetch } from '@/hooks/dashboard/useDashboardFetch';
import { useLastUpdated } from '@/hooks/dashboard/useLastUpdated';
import { useRecentCalls } from '@/hooks/dashboard/useRecentCalls';
import { useToastNotification } from '@/hooks/dashboard/useToastNotification';

interface ChartDataItem {
  date: string;
  appels: number;
}

// Function to convert call stats into chart data
function convertToChartData(callStats: any): ChartDataItem[] {
  if (!callStats || !callStats.callsPerDay) {
    return [];
  }
  
  return Object.entries(callStats.callsPerDay)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      appels: typeof count === 'number' ? count : 0,
    }));
}

export function useDashboardStats() {
  const { 
    callStats, 
    callsData, 
    isLoading, 
    hasError, 
    handleRefresh 
  } = useDashboardFetch();
  
  const hasData = !!(callStats || callsData);
  
  const { lastUpdated, setLastUpdated } = useLastUpdated(isLoading, hasError, hasData);
  const chartData = convertToChartData(callStats);
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
    recentCalls,
    chartData,
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh: handleRefreshWithToast
  };
}
