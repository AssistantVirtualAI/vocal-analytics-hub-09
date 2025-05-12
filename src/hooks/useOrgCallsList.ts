
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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

interface CallResponse {
  calls: {
    id: string;
    customer_id: string;
    customer_name: string;
    agent_id: string;
    agent_name: string;
    date: string;
    duration: number;
    audio_url: string;
    summary: string;
    transcript?: string;
    satisfaction_score: number;
    tags: string[];
  }[];
  count: number;
}

interface FormattedCallsResponse {
  calls: Call[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
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

  // Use explicit type for queryKey to avoid excessive type instantiation
  const queryKey = ["orgCalls", { 
    orgSlug, 
    limit, 
    page, 
    startDate, 
    endDate, 
    agentId, 
    customerId, 
    satisfactionScore, 
    sortBy, 
    sortOrder 
  }] as const;

  return useQuery({
    queryKey,
    queryFn: async (): Promise<FormattedCallsResponse> => {
      if (!user || !orgSlug) {
        throw new Error("Authentication and organization required");
      }

      try {
        // First, get the organization details from the slug
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, agent_id')
          .eq('slug', orgSlug)
          .single();
        
        if (orgError) {
          console.error("Error fetching organization:", orgError);
          throw new Error(`Organization not found: ${orgError.message}`);
        }
        
        if (!orgData) {
          console.error("No organization data found for slug:", orgSlug);
          throw new Error("Organization not found");
        }

        // Use the provided agentId or the organization's agent_id
        const effectiveAgentId = agentId || orgData.agent_id;

        // Then, fetch calls for this organization's agent
        const { data, error } = await supabase.functions.invoke<CallResponse>("get-calls", {
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

        if (!data || !data.calls) {
          console.warn("No calls data found for organization");
          return {
            calls: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page
          };
        }

        // Format the calls to match our Call type
        const formattedCalls: Call[] = data.calls.map((call) => ({
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error("Error in useOrgCallsList:", errorMessage);
        toast.error(`Failed to load calls: ${errorMessage}`);
        throw error;
      }
    },
    enabled: !!user && !!orgSlug && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    meta: {
      errorMessage: "Failed to load organization calls"
    }
  });
};
