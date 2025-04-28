
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CustomerStats } from "@/types";

export const useCustomerStats = () => {
  return useQuery({
    queryKey: ["customerStats"],
    queryFn: async () => {
      // Instead of using RPC, let's query directly from calls_view
      const { data: callsData, error } = await supabase
        .from("calls_view")
        .select(`
          customer_id,
          customer_name,
          duration,
          satisfaction_score
        `);

      if (error) throw error;

      if (!callsData || callsData.length === 0) return [];
      
      // Process the data to calculate statistics
      const customerStatsMap: Record<string, any> = {};
      
      callsData.forEach((call) => {
        const customerId = call.customer_id;
        if (!customerId) return;
        
        if (!customerStatsMap[customerId]) {
          customerStatsMap[customerId] = {
            customerId,
            customerName: call.customer_name,
            totalCalls: 0,
            totalDuration: 0,
            totalSatisfaction: 0,
          };
        }
        
        customerStatsMap[customerId].totalCalls += 1;
        customerStatsMap[customerId].totalDuration += call.duration || 0;
        customerStatsMap[customerId].totalSatisfaction += call.satisfaction_score || 0;
      });
      
      // Convert to array and calculate averages
      return Object.values(customerStatsMap).map((stat: any) => ({
        customerId: stat.customerId,
        customerName: stat.customerName,
        totalCalls: stat.totalCalls,
        avgDuration: stat.totalCalls > 0 ? stat.totalDuration / stat.totalCalls : 0,
        avgSatisfaction: stat.totalCalls > 0 ? stat.totalSatisfaction / stat.totalCalls : 0,
      })) as CustomerStats[];
    },
  });
};
