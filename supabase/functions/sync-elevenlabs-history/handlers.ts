
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchElevenLabsHistory } from "../_shared/elevenlabs/history.ts";
import { syncHistoryItems } from "./service.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Handle history sync request
 */
export async function handleHistorySyncRequest(req: Request): Promise<Response> {
  console.log("Edge function sync-elevenlabs-history called");
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || "";
    
    // Check for required env vars
    if (!elevenlabsApiKey) {
      console.error("ELEVENLABS_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "MISSING_API_KEY",
            message: "Missing ElevenLabs API key. Please configure ELEVENLABS_API_KEY in your environment."
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Parse request body
    const { agentId } = await req.json();
    
    if (!agentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "MISSING_AGENT_ID",
            message: "Missing agent ID in request"
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Fetching ElevenLabs history for agent ID: ${agentId}`);
    
    // Fetch history from ElevenLabs
    const historyResult = await fetchElevenLabsHistory(elevenlabsApiKey, agentId);
    
    if (!historyResult.success) {
      console.error("Error fetching ElevenLabs history:", historyResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "ELEVENLABS_FETCH_ERROR",
            message: historyResult.error
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const historyItems = historyResult.data || [];
    
    if (historyItems.length === 0) {
      console.log("No history items found");
      return new Response(
        JSON.stringify({
          success: true,
          results: [],
          summary: { total: 0, success: 0, error: 0 }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Retrieved ${historyItems.length} history items from ElevenLabs`);
    
    // Sync history items with database
    const results = await syncHistoryItems(supabaseUrl, supabaseServiceKey, historyItems, agentId);
    
    // Generate summary statistics
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({
        success: errorCount === 0,
        results,
        summary: {
          total: historyItems.length,
          success: successCount,
          error: errorCount
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in sync-elevenlabs-history:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNEXPECTED_ERROR",
          message: error instanceof Error ? error.message : String(error)
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}
