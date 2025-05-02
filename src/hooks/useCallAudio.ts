
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

interface FunctionError {
  code: string;
  message: string;
}

interface CallAudioResponse {
  audioUrl: string;
  transcript: string;
  summary: string;
  statistics?: ElevenLabsStatistics;
  error?: FunctionError;
}

export const useCallAudio = (callId: string | undefined) => {
  const queryClient = useQueryClient();

  const queryResult = useQuery<CallAudioResponse, Error>({
    queryKey: ["callAudio", callId],
    queryFn: async () => {
      if (!callId) throw new Error("Call ID is required");

      console.log(`Invoking Supabase function 'elevenlabs-call-audio' for call ID: ${callId}`);
      const { data, error } = await supabase.functions.invoke<CallAudioResponse>("elevenlabs-call-audio", {
        body: { callId },
      });

      // Handle Supabase function invocation errors (network, permissions etc.)
      if (error) {
        console.error("Supabase function invocation error:", error);
        throw new Error(`Failed to invoke Supabase function: ${error.message}`); 
      }

      // Handle errors returned *within* the function's response payload
      if (data?.error) {
        console.error("Error returned from Supabase function:", data.error);
        const functionError = new Error(data.error.message || "An error occurred in the backend function.") as any;
        functionError.code = data.error.code; // Attach the code for frontend handling
        throw functionError;
      }
      
      // Handle cases where data is unexpectedly null/undefined without an error
      if (!data) {
        console.error("No data returned from Supabase function, but no error reported.");
        throw new Error("Received unexpected empty response from the backend.");
      }

      console.log(`Successfully received data from 'elevenlabs-call-audio' for call ID: ${callId}`);
      return {
        audioUrl: data.audioUrl,
        transcript: data.transcript,
        summary: data.summary,
        statistics: data.statistics
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

  return queryResult;
};
