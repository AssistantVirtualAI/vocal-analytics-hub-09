import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ElevenLabsCallDetails {
  id: string;
  agent_id: string;
  status: string;
  caller_id: string;
  caller_name: string;
  start_time_unix: number;
  end_time_unix: number;
  duration: number;
  transcript: Array<{ 
    text: string;
    role: string; 
    timestamp?: number;
  }>;
  messages: Array<any>;
  audio_url: string | null;
  source: string;
}

export function useElevenLabsCallDetails(conversationId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);

  const query = useQuery({
    queryKey: ['elevenlabs-call-details', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        return null;
      }
      
      setIsLoading(true);
      let retries = 0;
      const maxRetries = 3;
      
      while (retries <= maxRetries) {
        try {
          console.log(`Fetching details for ElevenLabs conversation: ${conversationId} (attempt ${retries + 1}/${maxRetries + 1})`);
          
          const { data, error } = await supabase.functions.invoke<{ data: ElevenLabsCallDetails, error?: string }>(
            'get-elevenlabs-call-details',
            {
              body: { 
                conversation_id: conversationId,
                agent_id: 'QNdB45Jpgh06Hr67TzFO'  // Always include the specified agent ID
              }
            }
          );
          
          if (error) {
            console.error('Supabase function error:', error);
            throw new Error(error);
          }
          
          console.log('Response from get-elevenlabs-call-details:', data);
          
          if (!data) {
            throw new Error('No data returned from get-elevenlabs-call-details function');
          }
          
          if (data.error) {
            // Check for rate limiting specifically
            if (data.error.includes('rate limit') || data.error.includes('quota exceeded')) {
              if (retries < maxRetries) {
                retries++;
                const delay = 1000 * Math.pow(2, retries); // Exponential backoff
                console.log(`Rate limited, retrying in ${delay/1000}s (attempt ${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Try again
              }
            }
            throw new Error(data.error);
          }
          
          return data.data;
        } catch (error) {
          // If this is the last retry, show a toast and throw
          if (retries >= maxRetries) {
            console.error('Error fetching ElevenLabs call details after all retries:', error);
            toast({
              title: 'Erreur',
              description: `Impossible de récupérer les détails de l'appel ElevenLabs après plusieurs tentatives: ${error.message || error}`,
              variant: 'destructive'
            });
            throw error;
          }
          
          // Otherwise, increment retry counter and try again
          retries++;
          const delay = 1000 * Math.pow(2, retries); // Exponential backoff
          console.log(`Request failed, retrying in ${delay/1000}s (attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // This should never be reached due to the loop's exit conditions
      throw new Error(`Failed to fetch call details after ${maxRetries} retries`);
    },
    enabled: !!conversationId,
    // Add retry behavior for the React Query layer
    retry: 2, // We handle most retries manually, but add a couple more at this level
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff capped at 10 seconds
  });

  return {
    callDetails: query.data,
    isLoading: query.isPending || isLoading,
    error: query.error,
    refetch: query.refetch,
    isError: query.isError,
    isRefetching: query.isRefetching
  };
}
