
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { reportApiMetrics, handleApiError } from "@/utils/api-metrics";
import { toast } from "@/hooks/use-toast";

interface ElevenLabsCallAudio {
  audioUrl: string;
  transcript?: string;
  summary?: string;
  statistics?: {
    totalWords?: number;
    totalCharacters?: number;
    durationMs?: number;
    averageWordLength?: number;
    wordsPerMinute?: number;
    speakingTime?: number;
    silenceTime?: number;
  };
  error?: string;
}

export const useCallAudio = (callId: string | undefined) => {
  return useQuery({
    queryKey: ["elevenlabs-audio", callId],
    queryFn: async (): Promise<ElevenLabsCallAudio> => {
      if (!callId) throw new Error("Call ID is required");

      const startTime = Date.now();

      try {
        // Appel à notre fonction edge pour récupérer les données audio
        const { data, error } = await supabase.functions.invoke(
          "elevenlabs-call-audio",
          {
            body: { callId, useConversationalApi: true }
          }
        );

        if (error) {
          await reportApiMetrics("elevenlabs-call-audio", startTime, 500, error.message);
          throw error;
        }

        if (!data) {
          const errorMsg = "No data returned from ElevenLabs API";
          await reportApiMetrics("elevenlabs-call-audio", startTime, 404, errorMsg);
          throw new Error(errorMsg);
        }

        // Signaler l'appel API réussi
        await reportApiMetrics("elevenlabs-call-audio", startTime, 200);

        return {
          audioUrl: data.audioUrl,
          transcript: data.transcript,
          summary: data.summary,
          statistics: data.statistics
        };
      } catch (error: any) {
        // Traiter différents types d'erreurs pour l'UI
        let errorCode: string | undefined = undefined;

        if (error.message && typeof error.message === 'string') {
          if (error.message.includes('Authentication failed') || error.message.includes('API Key')) {
            errorCode = 'ELEVENLABS_AUTH_ERROR';
          } else if (error.message.includes('not found')) {
            errorCode = 'ELEVENLABS_NOT_FOUND';
          } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
            errorCode = 'ELEVENLABS_QUOTA_EXCEEDED';
          }
        }

        // Custom error object with code for easier UI handling
        const enhancedError = new Error(error.message || "Failed to load audio from ElevenLabs");
        (enhancedError as any).code = errorCode;

        handleApiError(error, (props) => {
          toast(props.title, {
            description: props.description,
            variant: props.variant as "default" | "destructive" | undefined
          });
        }, "Impossible de charger l'audio depuis ElevenLabs");
        
        throw enhancedError;
      }
    },
    // Only fetch when callId is available
    enabled: !!callId,
    // Cache for 1 hour
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000 // Formerly cacheTime
  });
};
