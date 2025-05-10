
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/types";
import { reportApiMetrics } from "@/utils/api-metrics";

export const useCallDetails = (callId: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["call", callId],
    queryFn: async () => {
      if (!callId) throw new Error("Call ID is required");

      const startTime = Date.now();

      try {
        const { data, error } = await supabase.functions.invoke("get-call", {
          body: { callId },
        });

        if (error) {
          await reportApiMetrics("get-call", startTime, 500, error.message);
          throw error;
        }

        if (!data) {
          const errorMsg = "Call not found";
          await reportApiMetrics("get-call", startTime, 404, errorMsg);
          throw new Error(errorMsg);
        }
        
        // Report successful API call
        await reportApiMetrics("get-call", startTime, 200);

        // Format the response to match our Call type
        const formattedCall: Call = {
          id: data.id,
          customerId: data.customer_id,
          customerName: data.customer_name,
          agentId: data.agent_id,
          agentName: data.agent_name,
          date: data.date,
          duration: data.duration,
          audioUrl: data.audio_url || "",
          summary: data.summary || "",
          transcript: data.transcript || undefined,
          satisfactionScore: data.satisfaction_score || 0,
          tags: data.tags || [],
        };

        return formattedCall;
      } catch (error: any) {
        console.error("Error fetching call details:", error);
        throw error;
      }
    },
    enabled: !!callId,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes (formerly cacheTime)
  });
};
