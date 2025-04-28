
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CustomerStats } from "@/types";

export const useCustomerStats = () => {
  return useQuery({
    queryKey: ["customerStats"],
    queryFn: async () => {
      const { data: customerStats, error } = await supabase
        .rpc('calculate_customer_stats');

      if (error) throw error;

      return customerStats.map((stat: any) => ({
        customerId: stat.customer_id,
        customerName: stat.customer_name,
        totalCalls: stat.total_calls,
        avgDuration: stat.avg_duration,
        avgSatisfaction: stat.avg_satisfaction,
      }));
    },
  });
};
