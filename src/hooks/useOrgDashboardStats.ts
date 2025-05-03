
import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useOrg } from '@/context/OrgContext';
import { useCallStats } from '@/hooks/useCallStats';
import { useOrgCallsList } from '@/hooks/useOrgCallsList';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/types/calendar';
import { Call } from '@/types';

interface FilterOptions {
  dateRange?: DateRange;
  agentId?: string;
  customerId?: string;
  satisfactionScore?: number;
}

export function useOrgDashboardStats(orgSlug: string | undefined, initialFilters?: FilterOptions) {
  const [lastUpdated, setLastUpdated] = useState<string>(
    formatDistanceToNow(new Date(), { addSuffix: true, locale: fr })
  );
  const [chartData, setChartData] = useState<{ date: string; appels: number }[]>([]);
  const { currentOrg } = useOrg();
  const agentId = currentOrg?.agentId;

  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
      }
    }
  );
  
  const getFormattedDates = () => {
    const { dateRange } = filters;
    if (!dateRange?.from || !dateRange?.to) return { startDate: '', endDate: '' };
    
    return {
      startDate: format(dateRange.from, 'yyyy-MM-dd'),
      endDate: format(dateRange.to, 'yyyy-MM-dd'),
    };
  };

  const { startDate, endDate } = getFormattedDates();
  
  const { 
    data: callStats, 
    isLoading: callStatsLoading, 
    error: callStatsError,
    refetch: refetchCallStats 
  } = useCallStats(!!agentId, agentId);
  
  const {
    data: callsData,
    isLoading: callsLoading,
    error: callsError,
    refetch: refetchCalls
  } = useOrgCallsList({
    orgSlug,
    limit: 20,
    startDate,
    endDate,
    agentId: filters.agentId,
    customerId: filters.customerId,
    satisfactionScore: filters.satisfactionScore
  });

  const fetchChartData = useCallback(async () => {
    if (!agentId) return;
    
    const { startDate, endDate } = getFormattedDates();
    
    try {
      const { data, error } = await supabase.functions.invoke("get_calls_per_day", {
        body: JSON.stringify({
          agentId,
          startDate,
          endDate
        }),
      });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        // Format the data for the chart
        const formattedData = data.map((item: any) => ({
          date: format(new Date(item.date), 'dd/MM', { locale: fr }),
          appels: item.count
        }));
        setChartData(formattedData);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  }, [agentId, filters.dateRange]);
  
  useEffect(() => {
    if (agentId) {
      fetchChartData();
    }
  }, [agentId, fetchChartData]);

  useEffect(() => {
    if (!callStatsLoading && !callsLoading && !callStatsError && !callsError) {
      setLastUpdated(formatDistanceToNow(new Date(), { addSuffix: true, locale: fr }));
    }
  }, [callStatsLoading, callsLoading, callStatsError, callsError]);

  const isLoading = callStatsLoading || callsLoading;
  const hasError = !!(callStatsError || callsError);

  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchCallStats(),
        refetchCalls(),
        fetchChartData()
      ]);
      
      setLastUpdated(formatDistanceToNow(new Date(), { addSuffix: true, locale: fr }));
      toast.success('Données actualisées avec succès');
      
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast.error('Erreur lors de l\'actualisation des données');
    }
  };
  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return {
    callStats,
    calls: callsData?.calls,
    totalCalls: callsData?.totalCount,
    chartData,
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh,
    formatDuration,
    applyFilters
  };
}
