
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncHistoryItems } from "./service.ts";
import { fetchElevenLabsHistory } from "../_shared/elevenlabs/history.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { checkUserOrganizationAccess } from "../_shared/agent-resolver-improved.ts";

// Handle the history sync request
export async function handleHistorySyncRequest(req: Request): Promise<Response> {
  try {
    // Check environment variables first
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || Deno.env.get("ELEVEN_LABS_API_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey || !elevenLabsApiKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
      if (!elevenLabsApiKey) missingVars.push('ELEVENLABS_API_KEY/ELEVEN_LABS_API_KEY');
      
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error(`[handleHistorySyncRequest] ${errorMsg}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { 
            message: errorMsg,
            code: "MISSING_ENV_VARIABLES"
          } 
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

    // Parse the body to get the agentId
    const body = await req.json();
    const { agentId } = body || {};
    
    // Create Supabase admin client for user verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[handleHistorySyncRequest] No authorization header provided");
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Authorization required",
            code: "UNAUTHORIZED"
          }
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
    
    // Extract JWT token and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[handleHistorySyncRequest] Invalid authentication:", userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Invalid authentication",
            code: "UNAUTHORIZED"
          }
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
    
    // Check agent ID
    if (!agentId) {
      console.error("[handleHistorySyncRequest] No agentId provided");
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "agentId is required",
            code: "MISSING_AGENT_ID"
          }
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

    // Verify user has access to agent/organization
    const hasAccess = await checkUserOrganizationAccess(
      supabaseAdmin, 
      user.id, 
      undefined, // We'll check based on agent instead of org
      agentId
    );

    if (!hasAccess) {
      console.error(`[handleHistorySyncRequest] User ${user.id} does not have access to agent ${agentId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "You do not have access to this agent",
            code: "FORBIDDEN"
          }
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    console.log(`[handleHistorySyncRequest] Fetching ElevenLabs history for agent ${agentId}`);
    
    // Fetch the history from ElevenLabs
    const historyResult = await fetchElevenLabsHistory(elevenLabsApiKey);
    
    if (!historyResult.success) {
      console.error(`[handleHistorySyncRequest] Error fetching ElevenLabs history: ${historyResult.error}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { 
            message: historyResult.error || "Failed to fetch ElevenLabs history",
            code: "ELEVENLABS_FETCH_ERROR" 
          }
        }),
        { 
          status: 502,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
    
    // Check if we have any history items
    if (!historyResult.data || historyResult.data.length === 0) {
      console.log("[handleHistorySyncRequest] No history items found to sync");
      return new Response(
        JSON.stringify({
          success: true,
          results: [],
          summary: {
            total: 0,
            success: 0,
            error: 0
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    // Process the history items
    console.log(`[handleHistorySyncRequest] Syncing ${historyResult.data.length} history items`);
    
    const results = await syncHistoryItems(
      supabaseUrl,
      supabaseServiceKey,
      historyResult.data,
      agentId
    );
    
    // Generate summary statistics
    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      error: results.filter(r => !r.success).length
    };
    
    console.log(`[handleHistorySyncRequest] Sync completed: ${summary.success}/${summary.total} successful, ${summary.error} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary
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
    console.error(`[handleHistorySyncRequest] Error processing request:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: "INTERNAL_SERVER_ERROR"
        }
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
