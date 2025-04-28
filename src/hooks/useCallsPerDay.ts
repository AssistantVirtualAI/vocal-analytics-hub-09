import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export const useCallsPerDay = (days = 14) => {
  return useQuery({
    queryKey: ["callsPerDay", days],
    queryFn: async () => {
      // Calculate the date range
      const today = new Date();
      const startDate = subDays(today, days);
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      
      // Query calls grouped by date
      const { data, error } = await supabase.rpc('get_calls_per_day', {
        start_date: formattedStartDate,
        days_count: days
      }).catch(() => {
        // Fallback if the RPC doesn't exist, we'll use client-side grouping
        return supabase
          .from('calls')
          .select('date')
          .gte('date', formattedStartDate)
          .order('date');
      });
      
      if (error) {
        console.error('Error fetching calls per day:', error);
        throw error;
      }
      
      // If we got results from the RPC function
      if (data && Array.isArray(data) && data[0] && 'date' in data[0] && 'count' in data[0]) {
        return data.map((item: any) => ({
          date: format(new Date(item.date), 'dd/MM'),
          appels: item.count
        }));
      }
      
      // Otherwise, we'll process the data client-side
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
    }
  });
};
