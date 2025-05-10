
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
  agentId,
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
        const params = new URLSearchParams();
        
        if (agentId) {
          params.append('agent_id', agentId);
        }
        
        if (fromDate) {
          params.append('from_date', fromDate.toISOString());
        }
        
        if (toDate) {
          params.append('to_date', toDate.toISOString());
        }
        
        const queryParams = params.toString();
        const url = queryParams ? `get-elevenlabs-calls?${queryParams}` : 'get-elevenlabs-calls';
        
        console.log(`Calling Supabase function: ${url}`);
        
        const { data, error } = await supabase.functions.invoke<{ data: ElevenLabsCall[] }>(
          url,
          {
            method: 'GET'
          }
        );
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        if (!data || !data.data) {
          console.warn('No data returned from ElevenLabs calls function');
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
        return []; // Return empty array instead of throwing to avoid React Query error state
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
