
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface CallPerDayItem {
  date: string;
  count: number;
}

interface GetCallsPerDayParams {
  start_date: string;
  days_count: number;
}

interface CallsChartData {
  date: string;
  appels: number;
}

export const useCallsPerDay = (days = 14) => {
  return useQuery<CallsChartData[]>({
    queryKey: ["callsPerDay", days],
    queryFn: async () => {
      // Calculate the date range
      const today = new Date();
      const startDate = subDays(today, days);
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      
      try {
        // First attempt to use the RPC function if it exists
        const { data: rpcData, error: rpcError } = await supabase.rpc<CallPerDayItem>('get_calls_per_day', {
          start_date: formattedStartDate,
          days_count: days
        });
        
        if (!rpcError && rpcData) {
          // Process RPC data
          return [rpcData].map(item => ({
            date: format(new Date(item.date), 'dd/MM'),
            appels: item.count
          }));
        }
        
        // Fallback if RPC fails: query the calls table directly
        const { data, error } = await supabase
          .from('calls')
          .select('date')
          .gte('date', formattedStartDate)
          .order('date');
        
        if (error) {
          console.error('Error fetching calls per day:', error);
          throw error;
        }
        
        // Process the data client-side
        const dateCountMap: Record<string, number> = {};
        
        // Initialize all dates in the range with 0 count
        for (let i = 0; i <= days; i++) {
          const date = subDays(today, days - i);
          const dateKey = format(date, 'yyyy-MM-dd');
          dateCountMap[dateKey] = 0;
        }
        
        // Count calls per day
        if (data) {
          data.forEach((call: any) => {
            const callDate = format(new Date(call.date), 'yyyy-MM-dd');
            if (dateCountMap[callDate] !== undefined) {
              dateCountMap[callDate]++;
            }
          });
        }
        
        // Convert to array format for chart
        return Object.entries(dateCountMap).map(([dateKey, count]) => ({
          date: format(new Date(dateKey), 'dd/MM'),
          appels: count
        }));
      } catch (error) {
        console.error('Error fetching calls per day:', error);
        throw error;
      }
    }
  });
};
