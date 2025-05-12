
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TimeRange } from '@/components/dashboard/TimeRangeSelector';

export function useCallsPerDay(days = 14, enabled = true, agentId?: string, startDate?: string, endDate?: string, timeRange?: TimeRange) {
  return useQuery({
    queryKey: ['calls_per_day', days, agentId, startDate, endDate, timeRange],
    queryFn: async () => {
      try {
        // Include the timeRange in the request if provided
        const requestData: Record<string, any> = { days };
        if (agentId) requestData.agentId = agentId;
        if (startDate) requestData.startDate = startDate;
        if (endDate) requestData.endDate = endDate;
        if (timeRange) requestData.timeRange = timeRange;

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
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}
