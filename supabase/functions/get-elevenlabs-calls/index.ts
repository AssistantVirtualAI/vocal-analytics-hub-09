
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Main handler for the function
serve(async (req: Request) => {
  console.log("get-elevenlabs-calls function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request with CORS headers");
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Variable to store our parameters
    let agentId: string | undefined = undefined;
    let fromDateStr: string | undefined = undefined;
    let toDateStr: string | undefined = undefined;
    
    // Process parameters based on request method
    if (req.method === 'POST') {
      console.log("Processing POST request");
      try {
        const requestData = await req.json();
        console.log("Request body:", requestData);
        
        // Extract parameters from request body
        agentId = requestData.agent_id;
        fromDateStr = requestData.from_date;
        toDateStr = requestData.to_date;
      } catch (parseError) {
        console.error("Failed to parse request body:", parseError);
      }
    } else {
      // Default to GET method
      console.log("Processing GET request");
      const url = new URL(req.url);
      agentId = url.searchParams.get('agent_id') || undefined;
      fromDateStr = url.searchParams.get('from_date') || undefined;
      toDateStr = url.searchParams.get('to_date') || undefined;
    }
    
    console.log(`Request params: agent_id=${agentId}, from_date=${fromDateStr}, to_date=${toDateStr}`);
    
    // Get ElevenLabs API key from environment
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVEN_LABS_API_KEY');
    
    if (!apiKey) {
      console.error("ElevenLabs API key is not configured");
      return new Response(
        JSON.stringify({ 
          error: "ElevenLabs API key is not configured",
          data: [] 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    console.log(`Using ElevenLabs API key (masked): ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
    
    // Build query parameters for the ElevenLabs API call
    const params = new URLSearchParams();
    
    if (agentId) {
      params.append('agent_id', agentId);
    }
    
    if (fromDateStr) {
      const fromDate = new Date(fromDateStr);
      params.append('call_start_after_unix', Math.floor(fromDate.getTime() / 1000).toString());
    }
    
    if (toDateStr) {
      const toDate = new Date(toDateStr);
      params.append('call_start_before_unix', Math.floor(toDate.getTime() / 1000).toString());
    }
    
    // Add default limit
    params.append('limit', '100');
    
    // Call ElevenLabs API directly
    const apiUrl = `https://api.elevenlabs.io/v1/convai/conversations${params.size > 0 ? `?${params.toString()}` : ''}`;
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
        JSON.stringify({ 
          error: errorMessage,
          data: [] 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: status >= 400 && status < 600 ? status : 500,
        }
      );
    }

    // Successfully got response, convert to JSON
    const responseData = await response.json();
    const conversations = responseData.conversations || [];
    console.log(`Retrieved ${conversations.length} conversations from ElevenLabs API`);
    
    // Transform the conversations for the frontend
    const transformedCalls = conversations.map(call => ({
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
    
    // Return a structured error response
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred",
        data: [] 
      }),
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
