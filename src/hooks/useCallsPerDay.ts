
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { AGENT_ID } from "@/config/agent";
import { mockCalls } from "@/mockData";

interface UseCallsPerDayOptions {
  orgSlug?: string;
  startDate?: string;
  endDate?: string;
}

export const useCallsPerDay = (
  days = 14, 
  enabled = true, 
  orgSlug?: string,
  startDate?: string,
  endDate?: string
) => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  // Use organization's agent ID if available, otherwise fall back to the default
  const agentId = currentOrganization?.agentId || AGENT_ID;
  
  return useQuery({
    queryKey: ["callsPerDay", days, agentId, startDate, endDate, orgSlug],
    queryFn: async () => {
      if (!user) {
        throw new Error("Authentication required");
      }
      
      console.log(`Fetching calls per day for agent ${agentId} (last ${days} days)`);
      
      // If we have an orgSlug, get the org's agent_id first
      let effectiveAgentId = agentId;
      if (orgSlug) {
        try {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('agent_id')
            .eq('slug', orgSlug)
            .single();
          
          if (!orgError && orgData) {
            effectiveAgentId = orgData.agent_id;
          }
        } catch (error) {
          console.error("Error fetching organization agent_id:", error);
        }
      }
      
      const { data, error } = await supabase.functions.invoke("get_calls_per_day", {
        body: JSON.stringify({ 
          days, 
          agentId: effectiveAgentId,
          startDate,
          endDate
        })
      });

      if (error) {
        console.error("Error fetching calls per day:", error);
        throw error;
      }

      console.log("Calls per day data received:", data);
      
      // If we got no data or empty data, use mock data as fallback
      if (!data || Object.keys(data).length === 0) {
        console.log("No real data, using mock data as fallback");
        
        // Generate mock data for the past X days
        const mockData = {};
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        // Use mock calls to generate daily counts
        const filteredCalls = mockCalls.filter(call => {
          const callDate = new Date(call.date);
          return callDate >= startDate && callDate <= endDate;
        });

        for (const call of filteredCalls) {
          const dateStr = new Date(call.date).toISOString().split('T')[0];
          mockData[dateStr] = (mockData[dateStr] || 0) + 1;
        }
        
        return mockData;
      }
      
      return data;
    },
    enabled: !!user && !!agentId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
