
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { fetchAllElevenLabsConversations } from '../_shared/elevenlabs-api.ts';
import { getElevenLabsEnvVars } from '../_shared/env.ts';

interface RequestParams {
  agent_id?: string;
  from_date?: string;
  to_date?: string;
}

serve(async (req: Request) => {
  // Gestion CORS pour les requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id') || undefined;
    const fromDateStr = url.searchParams.get('from_date') || undefined;
    const toDateStr = url.searchParams.get('to_date') || undefined;
    
    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const toDate = toDateStr ? new Date(toDateStr) : undefined;
    
    console.log(`Fetching ElevenLabs calls with agent_id: ${agentId}, from_date: ${fromDateStr}, to_date: ${toDateStr}`);
    
    const { elevenlabsApiKey } = getElevenLabsEnvVars();
    
    if (!elevenlabsApiKey) {
      throw new Error("ElevenLabs API key is not configured");
    }
    
    const calls = await fetchAllElevenLabsConversations(elevenlabsApiKey, {
      agentId,
      fromDate,
      toDate,
      limit: 100
    });
    
    console.log(`Retrieved ${calls.length} conversations from ElevenLabs API`);
    
    // Transformer les données pour correspondre à votre modèle d'appel
    const transformedCalls = calls.map(call => ({
      id: call.id,
      customer_id: call.caller_id || 'unknown',
      customer_name: call.caller_name || 'Unknown Caller',
      duration: calculateDuration(call.start_time_unix, call.end_time_unix),
      date: new Date(call.start_time_unix * 1000).toISOString(),
      agent_id: call.agent_id,
      status: call.status || 'completed',
      source: 'elevenlabs'
    }));
    
    return new Response(
      JSON.stringify({ data: transformedCalls }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-elevenlabs-calls function:', error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Fonction utilitaire pour calculer la durée à partir des timestamps
function calculateDuration(startTime?: number, endTime?: number): number {
  if (!startTime || !endTime) return 0;
  return Math.floor((endTime - startTime) / 60); // Durée en minutes
}
