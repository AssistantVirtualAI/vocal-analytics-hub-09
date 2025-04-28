
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CallStats } from "@/types";
import { AGENT_ID } from "@/config/agent";

export const useCallStats = () => {
  return useQuery({
    queryKey: ["callStats", AGENT_ID],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-stats");

      if (error) throw error;

      // Format the response to match our CallStats type
      const statsData: CallStats = {
        totalCalls: data.totalCalls,
        avgDuration: data.avgDuration,
        avgSatisfaction: data.avgSatisfaction,
        callsPerDay: data.callsPerDay,
      };

      return statsData;
    },
  });
};
