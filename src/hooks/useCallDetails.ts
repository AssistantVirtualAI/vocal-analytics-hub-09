
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Call } from "@/types";

export const useCallDetails = (callId: string | undefined) => {
  return useQuery({
    queryKey: ["call", callId],
    queryFn: async () => {
      if (!callId) throw new Error("Call ID is required");

      const { data, error } = await supabase.functions.invoke("get-call", {
        body: { callId },
      });

      if (error) throw error;

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
    },
    enabled: !!callId,
  });
};
