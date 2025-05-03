
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CallStats } from "@/types";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { AGENT_ID } from "@/config/agent";

export const useCallStats = (enabled = true) => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  // Use organization's agent ID if available, otherwise fall back to the default
  const agentId = currentOrganization?.agentId || AGENT_ID;
  
  return useQuery({
    queryKey: ["callStats", agentId],
    queryFn: async () => {
      // Only fetch if authenticated
      if (!user) {
        throw new Error("Authentication required");
      }
      
      console.log(`Fetching call stats for agent: ${agentId}`);
      
      try {
        const { data, error } = await supabase.functions.invoke("get-stats", {
          body: { agentId }
        });

        if (error) {
          console.error("Error fetching call stats:", error);
          throw error;
        }

        console.log("Call stats data received:", data);

        // Format the response to match our CallStats type
        const statsData: CallStats = {
          totalCalls: data.totalCalls || 0,
          avgDuration: data.avgDuration || 0,
          avgSatisfaction: data.avgSatisfaction || 0,
          callsPerDay: data.callsPerDay || {},
          lastUpdated: new Date().toISOString(),
          topCustomers: data.topCustomers || [],
        };

        return statsData;
      } catch (error) {
        console.error("Error in useCallStats:", error);
        throw error;
      }
    },
    enabled: !!user && !!agentId && enabled, // Only run the query if the user is authenticated and agent ID is available
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
};
