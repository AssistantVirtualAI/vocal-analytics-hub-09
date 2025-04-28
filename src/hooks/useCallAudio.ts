
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CallAudioResponse {
  audioUrl: string;
  transcript: string;
  summary: string;
}

export const useCallAudio = (callId: string | undefined) => {
  return useQuery<CallAudioResponse>({
    queryKey: ["callAudio", callId],
    queryFn: async () => {
      if (!callId) throw new Error("Call ID is required");

      const { data, error } = await supabase.functions.invoke<CallAudioResponse>("elevenlabs-call-audio", {
        body: { callId },
      });

      if (error) throw error;

      if (!data) {
        throw new Error("No data returned from ElevenLabs");
      }

      return {
        audioUrl: data.audioUrl,
        transcript: data.transcript,
        summary: data.summary
      };
    },
    enabled: !!callId,
  });
};
