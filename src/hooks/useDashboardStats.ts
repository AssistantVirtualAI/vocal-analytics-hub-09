
import { useState, useEffect } from 'react';
import { useCallStats } from '@/hooks/useCallStats';
import { useCallsList } from '@/hooks/useCallsList';
import { useCustomerStats } from '@/hooks/useCustomerStats';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Call } from '@/types';

export function useDashboardStats() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
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
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const isLoading = callStatsLoading || customerStatsLoading || callsLoading;
  const hasError = callStatsError || customerStatsError || callsError;
  
  useEffect(() => {
    if (!isLoading && !hasError && (callStats || customerStats || callsData)) {
      setLastUpdated(new Date());
    }
  }, [isLoading, callStats, customerStats, callsData, hasError]);

  // Format the "last updated" text
  const formatLastUpdated = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'à l\'instant';
    if (diffMins === 1) return 'il y a 1 minute';
    if (diffMins < 60) return `il y a ${diffMins} minutes`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'il y a 1 heure';
    return `il y a ${diffHours} heures`;
  };

  // Generate chart data from real data
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

  // Get recent calls
  const getRecentCalls = (): Call[] => {
    return callsData?.calls || [];
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchCallStats(),
        refetchCustomerStats(),
        refetchCalls()
      ]);
      setLastUpdated(new Date());
      toast({
        title: "Succès",
        description: "Les données ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les données.",
        variant: "destructive",
      });
    }
  };

  return {
    callStats,
    customerStats,
    recentCalls: getRecentCalls(),
    chartData: getChartData(),
    lastUpdated: formatLastUpdated(),
    isLoading,
    hasError,
    handleRefresh
  };
}
