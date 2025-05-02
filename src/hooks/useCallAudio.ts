
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

interface ErrorResponse {
  code: string;
  message: string;
}

export const useCallAudio = (callId: string | undefined) => {
  return useQuery<CallAudioResponse>({
    queryKey: ["callAudio", callId],
    queryFn: async () => {
      if (!callId) throw new Error("Call ID is required");

      const { data, error } = await supabase.functions.invoke<CallAudioResponse | { error: ErrorResponse }>("elevenlabs-call-audio", {
        body: { callId },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned from ElevenLabs function");
      }

      // Check if the response contains an error object
      if ('error' in data) {
        const errorData = data.error;
        console.error(`ElevenLabs API error [${errorData.code}]:`, errorData.message);
        throw new Error(errorData.message || "Unknown error from ElevenLabs API");
      }

      // Cast to ensure TypeScript recognizes this as CallAudioResponse
      const response = data as CallAudioResponse;

      return {
        audioUrl: response.audioUrl,
        transcript: response.transcript,
        summary: response.summary,
        statistics: response.statistics
      };
    },
    enabled: !!callId,
    retry: (failureCount, error) => {
      // Don't retry on 4xx client errors, but retry on other errors
      const message = error.message || "";
      const is4xxError = message.includes("404") || 
                         message.includes("NOT_FOUND") || 
                         message.includes("BAD_REQUEST") ||
                         message.includes("ELEVENLABS_AUTH_ERROR");
      
      return !is4xxError && failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
