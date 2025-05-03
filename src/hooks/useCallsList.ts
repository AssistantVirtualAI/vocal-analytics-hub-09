
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/types";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { AGENT_ID } from "@/config/agent";

interface CallsListParams {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  agentId?: string;
  enabled?: boolean;
}

export const useCallsList = ({ 
  limit = 10, 
  page = 1, 
  sortBy = 'date',
  sortOrder = 'desc',
  search = '',
  customerId = '',
  startDate = '',
  endDate = '',
  agentId = '',
  enabled = true
}: CallsListParams = {}) => {
  // Calculate offset based on page number
  const offset = (page - 1) * limit;
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const organizationAgentId = currentOrganization?.agentId || AGENT_ID;
  
  // Use provided agentId or fall back to the organization's agentId
  const effectiveAgentId = agentId || organizationAgentId;

  return useQuery({
    queryKey: ["calls", { limit, page, offset, sortBy, sortOrder, search, customerId, agentId: effectiveAgentId, startDate, endDate }],
    queryFn: async () => {
      if (!user) {
        throw new Error("Authentication required");
      }

      console.log(`Fetching calls with agentId: ${effectiveAgentId}`);
      
      const { data, error } = await supabase.functions.invoke("get-calls", {
        body: JSON.stringify({
          limit,
          offset,
          sort: sortBy,
          order: sortOrder,
          search: search,
          customerId: customerId,
          agentId: effectiveAgentId,
          startDate: startDate,
          endDate: endDate
        }),
      });

      if (error) {
        console.error("Error fetching calls:", error);
        throw error;
      }

      console.log("Calls data received:", data);

      if (!data || !data.calls || data.calls.length === 0) {
        console.warn("No calls data found, making sure to return empty array to prevent errors");
        return {
          calls: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page
        };
      }

      // Format the calls to match our Call type
      const formattedCalls: Call[] = data.calls.map((call: any) => ({
        id: call.id,
        customerId: call.customer_id,
        customerName: call.customer_name,
        agentId: call.agent_id,
        agentName: call.agent_name || "Agent",
        date: call.date,
        duration: call.duration || 0,
        audioUrl: call.audio_url || "",
        summary: call.summary || "",
        transcript: call.transcript || undefined,
        satisfactionScore: call.satisfaction_score || 0,
        tags: call.tags || [],
      }));

      return {
        calls: formattedCalls,
        totalCount: data.count,
        totalPages: Math.ceil(data.count / limit),
        currentPage: page
      };
    },
    enabled: !!user && !!effectiveAgentId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry more than 2 times
      return failureCount < 2;
    }
  });
};
