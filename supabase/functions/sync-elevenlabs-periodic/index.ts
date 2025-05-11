
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { 
  fetchElevenLabsConversations,
  fetchAllElevenLabsConversations 
} from "../_shared/elevenlabs/conversations.ts";
import { fetchElevenLabsDashboardSettings } from "../_shared/elevenlabs/dashboard.ts";
import { createErrorResponse, ErrorCode } from "../_shared/elevenlabs/error.ts";

// Sync window: how far back in time to fetch conversations (in seconds)
const SYNC_WINDOW_SECONDS = 3600; // Default: 1 hour

// Environnement variables
function getEnvVars() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
  
  if (!supabaseUrl) throw new Error("SUPABASE_URL environment variable is not set");
  if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  if (!elevenlabsApiKey) throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  
  console.log("Environment variables validated successfully");
  
  return { supabaseUrl, supabaseServiceKey, elevenlabsApiKey };
}

// Get the last sync date
async function getLastSyncDate(supabase: any) {
  const { data, error } = await supabase
    .from("sync_log")
    .select("synced_at")
    .order("synced_at", { ascending: false })
    .limit(1);
  
  if (error) {
    console.error("Error fetching last sync date:", error);
    throw error;
  }
  
  if (data && data.length > 0) {
    console.log(`Last sync date: ${data[0].synced_at}`);
    return new Date(data[0].synced_at);
  }
  
  // Default to 1 hour ago if no sync log
  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() - 1);
  console.log(`No previous sync found, using default date: ${defaultDate.toISOString()}`);
  return defaultDate;
}

// Get active agents from dashboard settings
async function getActiveAgents(elevenlabsApiKey: string) {
  try {
    const dashboardSettings = await fetchElevenLabsDashboardSettings(elevenlabsApiKey);
    
    if (!dashboardSettings || !dashboardSettings.agents) {
      console.warn("No agents found in dashboard settings");
      return [];
    }
    
    const activeAgents = dashboardSettings.agents.filter((agent: any) => agent.status === "active");
    console.log(`Found ${activeAgents.length} active ElevenLabs agents`);
    
    return activeAgents;
  } catch (error) {
    console.error("Error fetching dashboard settings:", error);
    // Default to the agent ID defined in src/config/agent.ts
    return [{ id: "QNdB45Jpgh06Hr67TzFO", name: "Default Agent" }];
  }
}

// Log sync results to database
async function logSyncResults(supabase: any, agentId: string, results: any) {
  try {
    const { error } = await supabase
      .from("sync_log")
      .insert({
        agent_id: agentId,
        source: "elevenlabs",
        synced_at: new Date().toISOString(),
        total_items: results.total || 0,
        success_items: results.success || 0,
        failed_items: results.error || 0
      });
    
    if (error) {
      console.error("Error logging sync results:", error);
    }
  } catch (error) {
    console.error("Error inserting sync log:", error);
  }
}

// Handle sync requests
async function handleSyncRequest(req: Request): Promise<Response> {
  try {
    // Get environment variables
    const { supabaseUrl, supabaseServiceKey, elevenlabsApiKey } = getEnvVars();
    
    // Check if debug mode is enabled via query param or request body
    let debug = false;
    
    try {
      const url = new URL(req.url);
      debug = url.searchParams.get("debug") === "true";
      
      if (req.method === "POST") {
        const body = await req.json();
        debug = body.debug === true || debug;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the last sync date
    const lastSyncDate = await getLastSyncDate(supabase);
    
    // Get active agents
    const activeAgents = await getActiveAgents(elevenlabsApiKey);
    
    const allResults = [];
    
    for (const agent of activeAgents) {
      console.log(`Processing agent: ${agent.name} (${agent.id})`);
      
      // Fetch conversations since the last sync
      const fromUnixTime = Math.floor(lastSyncDate.getTime() / 1000);
      const apiUrl = `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agent.id}&call_start_after_unix=${fromUnixTime}&limit=100`;
      
      console.log(`Fetching ElevenLabs calls from URL: ${apiUrl}`);
      
      // Use the new fetchConversations function
      const conversationsData = await fetchElevenLabsConversations(elevenlabsApiKey, {
        agentId: agent.id,
        fromDate: lastSyncDate,
        limit: 100
      });
      
      const conversations = conversationsData.conversations || [];
      console.log(`Retrieved ${conversations.length} calls for agent ${agent.name}`);
      
      // Process each conversation
      let successCount = 0;
      let errorCount = 0;
      
      for (const conversation of conversations) {
        try {
          // Insert or update call in database
          const { error } = await supabase
            .from("calls")
            .upsert({
              id: conversation.id,
              agent_id: agent.id,
              date: new Date(conversation.start_time_unix * 1000).toISOString(),
              customer_id: null,
              customer_name: conversation.title || "Unknown Customer",
              duration: conversation.duration_seconds || 0,
              audio_url: `https://api.elevenlabs.io/v1/convai/conversations/${conversation.id}/audio`,
              transcript: conversation.messages?.map((m: any) => `${m.role}: ${m.text}`).join('\n') || "",
              source: "elevenlabs"
            });
          
          if (error) {
            console.error(`Error inserting call ${conversation.id}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing conversation ${conversation.id}:`, error);
          errorCount++;
        }
      }
      
      const agentResults = {
        agentId: agent.id,
        agentName: agent.name,
        total: conversations.length,
        success: successCount,
        error: errorCount
      };
      
      allResults.push(agentResults);
      
      // Log sync results
      await logSyncResults(supabase, agent.id, agentResults);
    }
    
    console.log(`Sync completed: ${allResults.reduce((sum, r) => sum + r.success, 0)} successful, ${allResults.reduce((sum, r) => sum + r.error, 0)} failed out of ${allResults.reduce((sum, r) => sum + r.total, 0)} total calls`);
    
    return new Response(
      JSON.stringify({
        success: true,
        results: allResults,
        debug: debug ? {
          lastSyncDate,
          activeAgents: activeAgents.map(a => ({ id: a.id, name: a.name }))
        } : undefined
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
    console.error("Error in periodic sync:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
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

// Handle CORS preflight requests
const handleCorsOptions = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

// Main entry point
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }
  
  // Handle sync requests
  try {
    return await handleSyncRequest(req);
  } catch (error) {
    console.error("Uncaught error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
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
});
