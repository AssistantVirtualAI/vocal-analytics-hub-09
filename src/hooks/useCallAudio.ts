
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ElevenLabsStatistics {
  // Duration statistics
  total_duration_seconds?: number;
  agent_talk_duration_seconds?: number;
  customer_talk_duration_seconds?: number;
  silence_duration_seconds?: number;
  
  // Percentage statistics
  agent_talk_percentage?: number;
  customer_talk_percentage?: number;
  silence_percentage?: number;
  
  // Sentiment analysis
  sentiment?: {
    label?: string;
    score?: number;
  };
  
  // Any additional properties
  [key: string]: any;
}

interface CallAudioResponse {
  audioUrl: string;
  transcript: string;
  summary: string;
  statistics?: ElevenLabsStatistics;
}

export const useCallAudio = (callId: string | undefined) => {
  return useQuery<CallAudioResponse>({
    queryKey: ["callAudio", callId],
    queryFn: async () => {
      if (!callId) throw new Error("Call ID is required");

      const { data, error } = await supabase.functions.invoke<CallAudioResponse>("elevenlabs-call-audio", {
        body: { callId },
      });

      if (error) {
        console.error("ElevenLabs API error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from ElevenLabs");
      }

      return {
        audioUrl: data.audioUrl,
        transcript: data.transcript,
        summary: data.summary,
        statistics: data.statistics
      };
    },
    enabled: !!callId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
