
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCallAudio = (callId: string | undefined) => {
  return useQuery({
    queryKey: ["callAudio", callId],
    queryFn: async () => {
      if (!callId) throw new Error("Call ID is required");

      const { data, error } = await supabase.functions.invoke("elevenlabs-call-audio", {
        body: JSON.stringify({ callId }),
      });

      if (error) throw error;

      return {
        audioUrl: data.audioUrl,
        transcript: data.transcript,
        summary: data.summary
      };
    },
    enabled: !!callId,
  });
};
