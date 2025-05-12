
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CustomerStats } from '@/types';
import { useOrgContext } from '@/context/OrgContext';

export function useCustomerStats(enabled = true) {
  const { currentOrg } = useOrgContext();
  const agentId = currentOrg?.agentId;

  return useQuery({
    queryKey: ['customerStats', agentId],
    queryFn: async (): Promise<CustomerStats[]> => {
      try {
        console.log(`Fetching customer stats for agent: ${agentId}`);
        
        if (!agentId) {
          console.warn('No agent ID available for fetching customer stats');
          return [];
        }

        const { data, error } = await supabase.functions.invoke('get-customer-stats', {
          body: { agentId }
        });

        if (error) {
          console.error('Error fetching customer stats:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in useCustomerStats:', error);
        throw error;
      }
    },
    enabled: !!agentId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes (previously cacheTime)
    retry: 1,
  });
}
