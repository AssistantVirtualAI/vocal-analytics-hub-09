
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/types";

interface CallsListParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useCallsList = ({ 
  limit = 10, 
  offset = 0, 
  sortBy = 'date',
  sortOrder = 'desc'
}: CallsListParams = {}) => {
  return useQuery({
    queryKey: ["calls", { limit, offset, sortBy, sortOrder }],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-calls", {
        body: JSON.stringify({
          limit,
          offset,
          sort: sortBy,
          order: sortOrder
        }),
      });

      if (error) throw error;

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
      };
    },
  });
};
