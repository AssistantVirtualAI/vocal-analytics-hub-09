
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
      try {
        console.log(`Fetching details for ElevenLabs conversation: ${conversationId}`);
        
        const { data, error } = await supabase.functions.invoke<{ data: ElevenLabsCallDetails, error?: string }>(
          'get-elevenlabs-call-details',
          {
            body: { conversation_id: conversationId }
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
          throw new Error(data.error);
        }
        
        return data.data;
      } catch (error) {
        console.error('Error fetching ElevenLabs call details:', error);
        toast({
          title: 'Erreur',
          description: `Impossible de récupérer les détails de l'appel ElevenLabs: ${error.message || error}`,
          variant: 'destructive'
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!conversationId
  });

  return {
    callDetails: query.data,
    isLoading: query.isPending || isLoading,
    error: query.error,
    refetch: query.refetch
  };
}
