
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchAllElevenLabsConversations } from "../_shared/elevenlabs-api.ts";
import { getElevenLabsEnvVars } from "../_shared/env.ts";

interface RequestParams {
  agent_id?: string;
  from_date?: string;
  to_date?: string;
}

// Main handler for the function
serve(async (req: Request) => {
  console.log("get-elevenlabs-calls function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request with CORS headers");
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
    
    // Get the API key from environment variables
    const { elevenlabsApiKey } = getElevenLabsEnvVars();
    
    if (!elevenlabsApiKey) {
      console.error("ElevenLabs API key is not configured");
      throw new Error("ElevenLabs API key is not configured");
    }
    
    console.log("Using ElevenLabs API key (first 5 chars):", elevenlabsApiKey.substring(0, 5) + "...");
    
    // Use the shared fetchAllElevenLabsConversations function to get the conversations
    const calls = await fetchAllElevenLabsConversations(elevenlabsApiKey, {
      agentId,
      fromDate,
      toDate,
      limit: 100
    });
    
    console.log(`Retrieved ${calls.length} conversations from ElevenLabs API`);
    
    // Transform the data for the frontend
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
    
    console.log(`Transformed ${transformedCalls.length} calls for response`);
    
    // Return the response
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
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        data: [] // Always include an empty data array for more resilient frontend handling
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500,
      }
    );
  }
});

// Helper function to calculate call duration in minutes
function calculateDuration(startTime?: number, endTime?: number): number {
  if (!startTime || !endTime) return 0;
  const durationInSeconds = endTime - startTime;
  return Math.max(1, Math.floor(durationInSeconds / 60)); // Ensure at least 1 minute
}
