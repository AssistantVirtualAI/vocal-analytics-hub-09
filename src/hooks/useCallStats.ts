
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CallStats } from "@/types";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";

export const useCallStats = () => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const agentId = currentOrganization?.agentId || 'QNdB45Jpgh06Hr67TzFO';
  
  return useQuery({
    queryKey: ["callStats", agentId],
    queryFn: async () => {
      // Only fetch if authenticated
      if (!user) {
        throw new Error("Authentication required");
      }
      
      const { data, error } = await supabase.functions.invoke("get-stats", {
        body: { agentId }
      });

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
    enabled: !!user, // Only run the query if the user is authenticated
  });
};
