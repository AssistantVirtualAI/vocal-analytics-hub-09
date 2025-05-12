
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TimeRange } from '@/components/dashboard/TimeRangeSelector';
import { AGENT_ID } from '@/config/agent';

export function useCallsPerDay(days = 14, enabled = true, agentId?: string, startDate?: string, endDate?: string, timeRange?: TimeRange) {
  // Use provided agentId or fallback to configured default
  const effectiveAgentId = agentId || AGENT_ID;
  
  return useQuery({
    queryKey: ['calls_per_day', days, effectiveAgentId, startDate, endDate, timeRange],
    queryFn: async () => {
      try {
        // Always include the agentId in the request
        const requestData: Record<string, any> = { 
          days,
          agentId: effectiveAgentId // Always include an agent ID
        };
        
        if (startDate) requestData.startDate = startDate;
        if (endDate) requestData.endDate = endDate;
        if (timeRange) requestData.timeRange = timeRange;

        console.log("Calling get_calls_per_day with:", requestData);

        const { data, error } = await supabase.functions.invoke('get_calls_per_day', {
          body: requestData
        });

        if (error) {
          console.error('Error fetching calls per day:', error);
          throw error;
        }

        // Format the data for the chart
        const formattedData = data || {};
        return formattedData;
      } catch (error) {
        console.error('Error in useCallsPerDay hook:', error);
        throw error;
      }
    },
    enabled: !!effectiveAgentId && enabled, // Only run query if we have an agentId
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}
