
import { useState, useEffect } from 'react';
import { useCallStats } from '@/hooks/useCallStats';
import { useCustomerStats } from '@/hooks/useCustomerStats';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useStatsData() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const { 
    data: callStats, 
    isLoading: callStatsLoading, 
    error: callStatsError,
    refetch: refetchCallStats 
  } = useCallStats();
  
  const { 
    data: customerStats, 
    isLoading: customerStatsLoading, 
    error: customerStatsError,
    refetch: refetchCustomerStats 
  } = useCustomerStats();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const isLoading = callStatsLoading || customerStatsLoading;
  const hasError = callStatsError || customerStatsError;
  
  useEffect(() => {
    if (!isLoading && !hasError && (callStats || customerStats)) {
      setLastUpdated(new Date());
    }
  }, [isLoading, callStats, customerStats, hasError]);

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

  // Generate sample data for testing if no real data
  const getChartData = () => {
    if (callStats?.callsPerDay && Object.keys(callStats.callsPerDay).length > 0) {
      return Object.entries(callStats.callsPerDay)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          appels: count,
        }))
        .slice(-14);
    } else {
      // Generate sample data if no real data available
      const data = [];
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        data.push({
          date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          appels: Math.floor(Math.random() * 10),
        });
      }
      return data;
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchCallStats(),
        refetchCustomerStats()
      ]);
      setLastUpdated(new Date());
      toast({
        title: "Succès",
        description: "Les statistiques ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les statistiques.",
        variant: "destructive",
      });
    }
  };

  return {
    activeTab,
    setActiveTab,
    callStats,
    customerStats,
    chartData: getChartData(),
    isLoading,
    hasError,
    formatLastUpdated,
    handleRefresh
  };
}
