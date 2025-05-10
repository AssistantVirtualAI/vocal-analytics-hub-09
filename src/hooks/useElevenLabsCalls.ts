
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ElevenLabsCall {
  id: string;
  customer_id: string;
  customer_name: string;
  duration: number;
  date: string;
  agent_id: string;
  status: string;
  source: string;
}

interface UseElevenLabsCallsOptions {
  agentId?: string;
  fromDate?: Date;
  toDate?: Date;
  enabled?: boolean;
}

export function useElevenLabsCalls({
  agentId = 'QNdB45Jpgh06Hr67TzFO',  // Default to this specific agent ID
  fromDate,
  toDate,
  enabled = true
}: UseElevenLabsCallsOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  
  const query = useQuery({
    queryKey: ['elevenlabs-calls', agentId, fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: async () => {
      setIsLoading(true);
      try {
        // Build query parameters
        const params: Record<string, string> = {};
        
        // Always set the agent_id to our default if not otherwise specified
        params.agent_id = agentId || 'QNdB45Jpgh06Hr67TzFO';
        
        if (fromDate) {
          params.from_date = fromDate.toISOString();
        }
        
        if (toDate) {
          params.to_date = toDate.toISOString();
        }
        
        console.log(`Fetching ElevenLabs calls with params:`, params);
        
        // Call Supabase function with query parameters
        const { data, error } = await supabase.functions.invoke<{ data: ElevenLabsCall[], error?: string }>(
          'get-elevenlabs-calls',
          { 
            body: params  // Use body instead of query to fix the TS error
          }
        );
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        console.log('Response from Supabase function:', data);
        
        if (!data) {
          console.warn('No data returned from ElevenLabs calls function');
          return [];
        }
        
        if (data.error) {
          console.error('ElevenLabs API error:', data.error);
          throw new Error(data.error);
        }
        
        if (!Array.isArray(data.data)) {
          console.warn('Expected data.data to be an array but got:', typeof data.data);
          return [];
        }
        
        console.log(`Retrieved ${data.data.length} calls from ElevenLabs`);
        return data.data;
      } catch (error) {
        console.error('Error fetching ElevenLabs calls:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les appels depuis ElevenLabs',
          variant: 'destructive'
        });
        return []; // Return empty array instead of throwing
      } finally {
        setIsLoading(false);
      }
    },
    enabled
  });
  
  return {
    calls: query.data || [],
    isLoading: query.isPending || isLoading,
    error: query.error,
    refetch: query.refetch
  };
}
