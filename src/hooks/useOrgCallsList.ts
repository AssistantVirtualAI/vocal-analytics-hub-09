
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface OrgCallsListParams {
  limit?: number;
  page?: number;
  orgSlug?: string;
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
  agentId?: string;
  customerId?: string;
  satisfactionScore?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useOrgCallsList = ({
  limit = 10,
  page = 1,
  orgSlug,
  enabled = true,
  startDate,
  endDate,
  agentId = '',
  customerId = '',
  satisfactionScore,
  sortBy = 'date',
  sortOrder = 'desc'
}: OrgCallsListParams = {}) => {
  const offset = (page - 1) * limit;
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orgCalls", { orgSlug, limit, page, startDate, endDate, agentId, customerId, satisfactionScore, sortBy, sortOrder }],
    queryFn: async () => {
      if (!user || !orgSlug) {
        throw new Error("Authentication and organization required");
      }

      console.log(`Fetching calls for organization slug: ${orgSlug} with filters: startDate=${startDate}, endDate=${endDate}`);
      
      // First, get the organization details from the slug
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, agent_id')
        .eq('slug', orgSlug)
        .single();
      
      if (orgError || !orgData) {
        console.error("Error fetching organization:", orgError);
        throw orgError || new Error("Organization not found");
      }

      // Use the provided agentId or the organization's agent_id
      const effectiveAgentId = agentId || orgData.agent_id;

      // Then, fetch calls for this organization's agent
      const { data, error } = await supabase.functions.invoke("get-calls", {
        body: JSON.stringify({
          limit,
          offset,
          sort: sortBy,
          order: sortOrder,
          agentId: effectiveAgentId,
          customerId,
          startDate,
          endDate,
          satisfactionScore
        }),
      });

      if (error) {
        console.error("Error fetching calls:", error);
        throw error;
      }

      console.log(`Retrieved ${data?.calls?.length || 0} calls for organization ${orgSlug}`);

      if (!data || !data.calls || data.calls.length === 0) {
        console.warn("No calls data found for organization");
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
    enabled: !!user && !!orgSlug && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
