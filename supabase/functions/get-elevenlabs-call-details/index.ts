
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request with CORS headers");
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversation_id');
    
    console.log(`Fetching details for conversation_id: ${conversationId}`);
    
    if (!conversationId) {
      console.error("Missing conversation_id parameter");
      return new Response(
        JSON.stringify({ 
          error: "Missing conversation_id parameter",
          data: null 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Get ElevenLabs API key from environment
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVEN_LABS_API_KEY');
    
    if (!apiKey) {
      console.error("ElevenLabs API key is not configured");
      return new Response(
        JSON.stringify({ 
          error: "ElevenLabs API key is not configured",
          data: null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    console.log(`Using ElevenLabs API key (masked): ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
    
    // Call ElevenLabs API to get conversation details
    const apiUrl = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;
    console.log(`Calling ElevenLabs API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      }
    });

    console.log(`ElevenLabs API response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = `ElevenLabs API returned status ${response.status}`;
      let responseText = "";
      
      try {
        responseText = await response.text();
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
        console.error("Error response from ElevenLabs:", errorData);
      } catch (parseError) {
        console.error("Failed to parse error response:", responseText, parseError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          data: null 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status >= 400 && response.status < 600 ? response.status : 500,
        }
      );
    }

    // Parse the response data
    const callDetails = await response.json();
    console.log(`Retrieved conversation details from ElevenLabs API`);
    
    // Transform the data for frontend use
    const transformedDetails = {
      id: callDetails.conversation_id || conversationId,
      agent_id: callDetails.agent_id,
      status: callDetails.status,
      caller_id: callDetails.caller_id,
      caller_name: callDetails.caller_name || "Unknown",
      start_time_unix: callDetails.start_time_unix,
      end_time_unix: callDetails.end_time_unix,
      duration: callDetails.end_time_unix && callDetails.start_time_unix 
        ? Math.floor((callDetails.end_time_unix - callDetails.start_time_unix) / 60)
        : 0,
      transcript: callDetails.transcript || [],
      messages: callDetails.messages || [],
      audio_url: callDetails.audio_url || null,
      source: 'elevenlabs'
    };
    
    console.log(`Transformed conversation details for response`);
    
    // Return the response
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
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        data: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
