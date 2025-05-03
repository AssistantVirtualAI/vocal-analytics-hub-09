
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CallStats } from "@/types";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";

export const useCallStats = () => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const agentId = currentOrganization?.agentId;
  
  return useQuery({
    queryKey: ["callStats", agentId],
    queryFn: async () => {
      // Only fetch if authenticated and organization is selected
      if (!user) {
        throw new Error("Authentication required");
      }
      
      if (!agentId) {
        console.warn("No agent ID available, cannot fetch call stats");
        throw new Error("Organization selection required");
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
        };

        return statsData;
      } catch (error) {
        console.error("Error in useCallStats:", error);
        throw error;
      }
    },
    enabled: !!user && !!agentId, // Only run the query if the user is authenticated and organization selected
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
};
