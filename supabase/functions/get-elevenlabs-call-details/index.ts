
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchElevenLabsConversationTranscript } from "../_shared/elevenlabs/conversations.ts";
import { createErrorResponse, ErrorCode } from "../_shared/elevenlabs/error.ts";

// Get environment variables
function getEnvVars() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
  
  if (!supabaseUrl) throw new Error("SUPABASE_URL environment variable is not set");
  if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  if (!elevenlabsApiKey) throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  
  return { supabaseUrl, supabaseServiceKey, elevenlabsApiKey };
}

// Handle CORS preflight requests
function handleCorsOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Main handler for getting call details
async function handleGetCallDetailsRequest(req: Request): Promise<Response> {
  console.log("Processing get-elevenlabs-call-details request");
  
  try {
    // Parse request body
    const { conversation_id, agent_id } = await req.json();
    
    if (!conversation_id) {
      return new Response(
        JSON.stringify({
          error: "conversation_id is required"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    // Get environment variables
    const { supabaseUrl, supabaseServiceKey, elevenlabsApiKey } = getEnvVars();
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if call exists in database
    console.log(`Checking for existing call with ID ${conversation_id}`);
    const { data: existingCall, error: fetchError } = await supabase
      .from("calls")
      .select("*")
      .eq("id", conversation_id)
      .single();
    
    let callDetails;
    
    if (existingCall) {
      console.log(`Found existing call in database: ${existingCall.id}`);
      
      // Format database record
      callDetails = {
        id: existingCall.id,
        agent_id: existingCall.agent_id || agent_id,
        status: existingCall.status || "completed",
        caller_id: existingCall.customer_id || null,
        caller_name: existingCall.customer_name || "Unknown Caller",
        start_time_unix: new Date(existingCall.date).getTime() / 1000,
        end_time_unix: new Date(existingCall.date).getTime() / 1000 + (existingCall.duration || 0),
        duration: existingCall.duration || 0,
        transcript: [],
        messages: [],
        audio_url: existingCall.audio_url || `https://api.elevenlabs.io/v1/convai/conversations/${conversation_id}/audio`,
        source: existingCall.source || "elevenlabs"
      };
      
      // Parse transcript if available
      if (existingCall.transcript) {
        try {
          // Check if transcript is already an array
          if (Array.isArray(existingCall.transcript)) {
            callDetails.transcript = existingCall.transcript;
          } else {
            // Parse transcript from text format (e.g., "agent: Hello\nuser: Hi")
            const lines = existingCall.transcript.split('\n');
            callDetails.transcript = lines.map(line => {
              const match = line.match(/^(.*?):\s*(.*)/);
              if (match) {
                return {
                  role: match[1].toLowerCase(),
                  text: match[2],
                };
              }
              return { role: "unknown", text: line };
            });
          }
        } catch (parseError) {
          console.error("Error parsing transcript:", parseError);
          callDetails.transcript = [{ role: "system", text: existingCall.transcript }];
        }
      }
    } else {
      console.log(`Call not found in database, fetching from ElevenLabs API: ${conversation_id}`);
      
      // Try to fetch detailed transcript from ElevenLabs API
      try {
        const transcriptData = await fetchElevenLabsConversationTranscript(conversation_id, elevenlabsApiKey);
        
        // Create a record with data from the API
        callDetails = {
          id: conversation_id,
          agent_id: agent_id || "unknown",
          status: "completed",
          caller_id: null,
          caller_name: "Unknown Caller",
          start_time_unix: transcriptData.start_time_unix || Math.floor(Date.now() / 1000 - 3600),
          end_time_unix: transcriptData.end_time_unix || Math.floor(Date.now() / 1000),
          duration: transcriptData.duration_seconds || 0,
          transcript: transcriptData.transcript || [],
          messages: transcriptData.messages || [],
          audio_url: `https://api.elevenlabs.io/v1/convai/conversations/${conversation_id}/audio`,
          source: "elevenlabs"
        };
        
        // Insert record into database for next time
        const { error: insertError } = await supabase
          .from("calls")
          .upsert({
            id: conversation_id,
            agent_id: agent_id,
            date: new Date(callDetails.start_time_unix * 1000).toISOString(),
            customer_name: "Unknown Caller",
            duration: callDetails.duration,
            audio_url: callDetails.audio_url,
            transcript: transcriptData.transcript ? 
              transcriptData.transcript.map(item => `${item.role}: ${item.text}`).join('\n') : 
              "",
            source: "elevenlabs"
          });
        
        if (insertError) {
          console.error("Error inserting call details:", insertError);
        }
      } catch (apiError) {
        console.error(`Error fetching from ElevenLabs API:`, apiError);
        return new Response(
          JSON.stringify({
            error: `Failed to fetch call details: ${apiError instanceof Error ? apiError.message : "Unknown error"}`
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }
    
    console.log(`Successfully processed call details for ${conversation_id}`);
    
    return new Response(
      JSON.stringify({
        data: callDetails
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
}

// Main entry point
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }
  
  // Handle main request
  return await handleGetCallDetailsRequest(req);
});
