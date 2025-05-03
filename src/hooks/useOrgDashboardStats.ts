
import { useState, useEffect } from 'react';
import { useCallStats } from '@/hooks/useCallStats';
import { useOrgCallsList } from '@/hooks/useOrgCallsList';
import { toast } from 'sonner';
import { useOrg } from '@/context/OrgContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function useOrgDashboardStats(orgSlug: string | undefined) {
  const [lastUpdated, setLastUpdated] = useState<string>(
    formatDistanceToNow(new Date(), { addSuffix: true, locale: fr })
  );
  
  const { currentOrg } = useOrg();
  const agentId = currentOrg?.agentId;
  
  const { 
    data: callStats, 
    isLoading: callStatsLoading, 
    error: callStatsError,
    refetch: refetchCallStats 
  } = useCallStats(!!agentId, agentId);
  
  const {
    isLoading: callsLoading,
    error: callsError,
    refetch: refetchCalls
  } = useOrgCallsList({ orgSlug });

  useEffect(() => {
    if (!callStatsLoading && !callsLoading && !callStatsError && !callsError) {
      setLastUpdated(formatDistanceToNow(new Date(), { addSuffix: true, locale: fr }));
    }
  }, [callStatsLoading, callsLoading, callStatsError, callsError]);

  const isLoading = callStatsLoading || callsLoading;
  const hasError = !!(callStatsError || callsError);

  // Function for manual refresh with loading state
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchCallStats(),
        refetchCalls()
      ]);
      
      setLastUpdated(formatDistanceToNow(new Date(), { addSuffix: true, locale: fr }));
      toast.success('Données actualisées avec succès');
      
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast.error('Erreur lors de l\'actualisation des données');
    }
  };
  
  // Utility function to format duration in minutes and seconds
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return {
    callStats,
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh,
    formatDuration
  };
}
