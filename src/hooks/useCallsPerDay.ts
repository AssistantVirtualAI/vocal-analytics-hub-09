
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";

export const useCallsPerDay = (days = 14) => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const agentId = currentOrganization?.agentId;
  
  return useQuery({
    queryKey: ["callsPerDay", days, agentId],
    queryFn: async () => {
      if (!user) {
        throw new Error("Authentication required");
      }
      
      if (!agentId) {
        console.warn("No agent ID available, cannot fetch calls per day");
        throw new Error("Organization selection required");
      }
      
      console.log(`Fetching calls per day for agent ${agentId} (last ${days} days)`);
      
      const { data, error } = await supabase.functions.invoke("get_calls_per_day", {
        body: { days, agentId }
      });

      if (error) {
        console.error("Error fetching calls per day:", error);
        throw error;
      }

      console.log("Calls per day data received:", data);
      
      // Format the data for the chart
      return Object.entries(data || {})
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          appels: count as number,
        }))
        .sort((a, b) => {
          // Sort by date (use the original date strings for proper sorting)
          const dateA = new Date(Object.keys(data).find(key => 
            new Date(key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) === a.date
          ) || "");
          
          const dateB = new Date(Object.keys(data).find(key => 
            new Date(key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) === b.date
          ) || "");
          
          return dateA.getTime() - dateB.getTime();
        });
    },
    enabled: !!user && !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
