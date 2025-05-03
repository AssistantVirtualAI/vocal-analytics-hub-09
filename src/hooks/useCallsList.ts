
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/types";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";

interface CallsListParams {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export const useCallsList = ({ 
  limit = 10, 
  page = 1, 
  sortBy = 'date',
  sortOrder = 'desc',
  search = '',
  customerId = '',
  startDate = '',
  endDate = ''
}: CallsListParams = {}) => {
  // Calculate offset based on page number
  const offset = (page - 1) * limit;
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const agentId = currentOrganization?.agentId || '';

  return useQuery({
    queryKey: ["calls", { limit, page, offset, sortBy, sortOrder, search, customerId, agentId, startDate, endDate }],
    queryFn: async () => {
      if (!user) {
        throw new Error("Authentication required");
      }

      console.log(`Fetching calls with agentId: ${agentId}`);
      
      const { data, error } = await supabase.functions.invoke("get-calls", {
        body: JSON.stringify({
          limit,
          offset,
          sort: sortBy,
          order: sortOrder,
          search: search,
          customerId: customerId,
          agentId: agentId,
          startDate: startDate,
          endDate: endDate
        }),
      });

      if (error) {
        console.error("Error fetching calls:", error);
        throw error;
      }

      console.log("Calls data received:", data);

      // Format the calls to match our Call type
      const formattedCalls: Call[] = data.calls.map((call: any) => ({
        id: call.id,
        customerId: call.customer_id,
        customerName: call.customer_name,
        agentId: call.agent_id,
        agentName: call.agent_name,
        date: call.date,
        duration: call.duration,
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
    enabled: !!user && !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
