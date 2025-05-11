
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchAllElevenLabsConversations } from "../_shared/elevenlabs/conversations.ts";
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

// Main handler for getting calls
async function handleGetCallsRequest(req: Request): Promise<Response> {
  console.log("Processing get-elevenlabs-calls request");
  
  try {
    // Parse request body
    const requestData = await req.json();
    console.log("Request data:", requestData);
    
    const { agent_id, from_date, to_date } = requestData;
    
    if (!agent_id) {
      return new Response(
        JSON.stringify({
          error: "agent_id is required"
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
    
    // First, try to get calls from database
    console.log(`Fetching calls from database for agent ${agent_id}`);
    let query = supabase
      .from("calls")
      .select("*")
      .eq("agent_id", agent_id)
      .order("date", { ascending: false });
    
    // Apply date filters if provided
    if (from_date) {
      console.log(`Filtering calls after ${from_date}`);
      query = query.gte("date", from_date);
    }
    
    if (to_date) {
      console.log(`Filtering calls before ${to_date}`);
      query = query.lte("date", to_date);
    }
    
    const { data: dbCalls, error: dbError } = await query;
    
    if (dbError) {
      console.error("Error fetching calls from database:", dbError);
      // Continue with API fetch even if db query fails
    }
    
    // Fetch calls from ElevenLabs API as well to ensure we have latest data
    console.log(`Fetching calls from ElevenLabs API for agent ${agent_id}`);
    
    let apiCalls = [];
    try {
      // Convert dates to Date objects if provided
      const fromDate = from_date ? new Date(from_date) : undefined;
      const toDate = to_date ? new Date(to_date) : undefined;
      
      apiCalls = await fetchAllElevenLabsConversations(elevenlabsApiKey, {
        agentId: agent_id,
        fromDate,
        toDate,
        limit: 100,
        maxPages: 3 // Limit to 3 pages (300 conversations) for performance
      });
      
      console.log(`Retrieved ${apiCalls.length} calls from ElevenLabs API`);
      
      // Import new calls to database
      for (const call of apiCalls) {
        // Check if call already exists in DB
        const { data: existing } = await supabase
          .from("calls")
          .select("id")
          .eq("id", call.id)
          .maybeSingle();
        
        if (!existing) {
          console.log(`Importing new call ${call.id} to database`);
          
          await supabase
            .from("calls")
            .insert({
              id: call.id,
              agent_id: agent_id,
              date: new Date(call.start_time_unix * 1000).toISOString(),
              customer_id: null,
              customer_name: call.title || "Unknown Customer",
              duration: call.duration_seconds || (call.end_time_unix ? call.end_time_unix - call.start_time_unix : 0),
              audio_url: `https://api.elevenlabs.io/v1/convai/conversations/${call.id}/audio`,
              transcript: call.messages?.map((m: any) => `${m.role}: ${m.text}`).join('\n') || "",
              source: "elevenlabs"
            });
        }
      }
    } catch (apiError) {
      console.error("Error fetching from ElevenLabs API:", apiError);
      // Continue with DB results if API fails
    }
    
    // Merge results, preferring database records but including new API records
    let allCalls = dbCalls || [];
    
    // Add API calls that don't exist in DB results
    for (const apiCall of apiCalls) {
      if (!allCalls.find((dbCall: any) => dbCall.id === apiCall.id)) {
        allCalls.push({
          id: apiCall.id,
          agent_id: agent_id,
          date: new Date(apiCall.start_time_unix * 1000).toISOString(),
          customer_id: null,
          customer_name: apiCall.title || "Unknown Customer",
          duration: apiCall.duration_seconds || 0,
          source: "elevenlabs"
        });
      }
    }
    
    // Format the calls for the response
    const formattedCalls = allCalls.map((call: any) => ({
      id: call.id,
      customer_id: call.customer_id || null,
      customer_name: call.customer_name || "Unknown Customer",
      duration: call.duration || 0,
      date: call.date,
      agent_id: call.agent_id,
      status: call.status || "completed",
      source: call.source || "elevenlabs"
    }));
    
    // Sort by date (most recent first)
    formattedCalls.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Returning ${formattedCalls.length} calls`);
    
    return new Response(
      JSON.stringify({
        data: formattedCalls
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
  return await handleGetCallsRequest(req);
});
