
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchWithRetry } from "../_shared/fetch-with-retry.ts";

// Main handler for the function
serve(async (req: Request) => {
  console.log("get-elevenlabs-call-details function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request with CORS headers");
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Default agent ID to always use
    const defaultAgentId = 'QNdB45Jpgh06Hr67TzFO';
    let conversationId: string | null = null;
    
    if (req.method === 'POST') {
      // Parse request body for POST requests
      try {
        const requestData = await req.json();
        console.log("Request body:", requestData);
        conversationId = requestData.conversation_id;
      } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
        return new Response(
          JSON.stringify({ error: 'Failed to parse request body' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    } else {
      // Parse URL parameters for GET requests
      const url = new URL(req.url);
      conversationId = url.searchParams.get('conversation_id');
    }
    
    if (!conversationId) {
      console.error("Missing conversation_id parameter");
      return new Response(
        JSON.stringify({ error: 'Missing conversation_id parameter' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    console.log(`Fetching conversation details for ID: ${conversationId}`);
    
    // Get ElevenLabs API key from environment
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVEN_LABS_API_KEY');
    
    if (!apiKey) {
      console.error("ElevenLabs API key is not configured");
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key is not configured" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    // Call ElevenLabs API to get conversation details using retry mechanism
    const apiUrl = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;
    console.log(`Calling ElevenLabs API: ${apiUrl}`);
    
    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      }
    }, 3); // Maximum 3 retries
    
    console.log(`ElevenLabs API response status: ${response.status}`);
    
    if (!response.ok) {
      const status = response.status;
      let errorMessage = `ElevenLabs API returned status ${status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail?.message || errorData.detail || errorMessage;
        console.error("Error response from ElevenLabs:", errorData);
      } catch (parseError) {
        console.error("Failed to parse error response", parseError);
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: status >= 400 && status < 600 ? status : 500,
        }
      );
    }
    
    // Successfully got response, convert to JSON
    const conversationData = await response.json();
    console.log("Received conversation data from ElevenLabs API");
    
    // Transform the conversation data for the frontend
    const transformedDetails = {
      id: conversationData.id,
      agent_id: conversationData.agent_id || defaultAgentId,
      status: conversationData.status || 'unknown',
      caller_id: conversationData.caller_id || 'unknown',
      caller_name: conversationData.caller_name || 'Unknown Caller',
      start_time_unix: conversationData.start_time_unix || 0,
      end_time_unix: conversationData.end_time_unix || 0,
      duration: calculateDuration(conversationData.start_time_unix, conversationData.end_time_unix),
      transcript: conversationData.transcript || [],
      messages: conversationData.messages || [],
      audio_url: conversationData.audio_url || null,
      source: 'elevenlabs'
    };
    
    // Return the transformed data
    return new Response(
      JSON.stringify({ data: transformedDetails }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-elevenlabs-call-details function:', error);
    
    // Return a structured error response
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
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

