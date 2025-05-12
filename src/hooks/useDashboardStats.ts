
import { useState } from 'react';
import { useDashboardFetch } from '@/hooks/dashboard/useDashboardFetch';
import { useLastUpdated } from '@/hooks/dashboard/useLastUpdated';
import { useRecentCalls } from '@/hooks/dashboard/useRecentCalls';
import { useToastNotification } from '@/hooks/dashboard/useToastNotification';
import { useCustomerStats } from '@/hooks/useCustomerStats';
import type { CustomerStats, Call } from '@/types';

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
    isLoading: callsLoading, 
    hasError: callsError, 
    handleRefresh: refreshCalls
  } = useDashboardFetch();
  
  const { 
    data: customerStatsData, 
    isLoading: customerStatsLoading, 
    isError: customerStatsError 
  } = useCustomerStats();

  const isLoading = callsLoading || customerStatsLoading;
  const hasError = callsError || customerStatsError;
  const hasData = !!(callStats || callsData || customerStatsData);
  
  const { lastUpdated, setLastUpdated } = useLastUpdated(isLoading, hasError, hasData);
  const chartData = convertToChartData(callStats);
  const { recentCalls } = useRecentCalls(callsData);
  const { showSuccessToast, showErrorToast } = useToastNotification();

  // Handle manual refresh
  const handleRefreshWithToast = async () => {
    try {
      await refreshCalls();
      setLastUpdated(new Date());
      showSuccessToast();
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      showErrorToast();
    }
  };

  return {
    callStats: callStats || { totalCalls: 0, avgDuration: 0, avgSatisfaction: 0, callsPerDay: {}, lastUpdated: new Date().toISOString(), topCustomers: [] },
    customerStats: customerStatsData || [],
    recentCalls: recentCalls || [],
    chartData: chartData || [],
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh: handleRefreshWithToast
  };
}
