
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CallsStatsResponse {
  totalCalls: number;
  avgDuration: number;  // en secondes
  avgSatisfaction: number; // sur 5
}

export const useCallsStats = () => {
  return useQuery<CallsStatsResponse>({
    queryKey: ["callsStats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls_view")
        .select("duration, satisfaction_score");

      if (error) throw error;

      const totalCalls = data.length;
      const avgDuration = data.reduce((sum, call) => sum + (call.duration || 0), 0) / (totalCalls || 1);
      const avgSatisfaction = data.reduce((sum, call) => sum + (call.satisfaction_score || 0), 0) / (totalCalls || 1);

      return {
        totalCalls,
        avgDuration,
        avgSatisfaction,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
