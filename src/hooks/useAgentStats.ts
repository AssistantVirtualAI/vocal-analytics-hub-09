
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";

export interface AgentStat {
  name: string;
  calls: number;
  satisfaction: number;
  avgDuration: number;
}

export const useAgentStats = () => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const agentId = currentOrganization?.agentId || 'QNdB45Jpgh06Hr67TzFO';
  
  return useQuery({
    queryKey: ["agentStats", agentId],
    queryFn: async () => {
      // Only fetch if authenticated
      if (!user) {
        throw new Error("Authentication required");
      }
      
      const { data, error } = await supabase
        .from("calls_view")
        .select("agent_name, duration, satisfaction_score")
        .eq('agent_id', agentId);

      if (error) throw error;

      // For now, we'll use mock data until the backend is properly set up
      const mockStats: AgentStat[] = [
        { name: 'Alice', calls: 45, satisfaction: 4.8, avgDuration: 320 },
        { name: 'Bob', calls: 38, satisfaction: 4.5, avgDuration: 280 },
        { name: 'Claire', calls: 52, satisfaction: 4.2, avgDuration: 350 },
        { name: 'David', calls: 29, satisfaction: 4.9, avgDuration: 240 },
      ];

      return mockStats;
    },
    enabled: !!user, // Only run the query if the user is authenticated
  });
};
