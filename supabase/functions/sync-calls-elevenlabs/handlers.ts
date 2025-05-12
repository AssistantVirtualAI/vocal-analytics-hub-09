
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SyncRequest, SyncResponse, SyncResult } from "./models.ts";
import { syncCalls } from "./service.ts";
import { corsHeaders } from "./utils.ts";

/**
 * Handle a sync request
 */
export async function handleSyncRequest(req: Request): Promise<Response> {
  console.log("Edge function sync-calls-elevenlabs called");

  try {
    // Parse request body
    const { calls, agentId } = await req.json() as SyncRequest;
    
    if (!calls || !Array.isArray(calls) || calls.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No calls provided or invalid format",
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!agentId) {
      return new Response(JSON.stringify({ 
        error: "No agent ID provided",
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Received ${calls.length} calls to sync for agent ID: ${agentId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials in environment variables");
      return new Response(JSON.stringify({ 
        error: "Server configuration error: missing credentials",
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Process each call
    const results: SyncResult[] = await syncCalls(supabase, calls, agentId);
    
    // Calculate summary statistics
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    const response: SyncResponse = {
      success: errorCount === 0,
      results,
      summary: {
        total: calls.length,
        success: successCount,
        error: errorCount
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in sync-calls-elevenlabs function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handle CORS preflight request
 */
export function handleCorsOptions(): Response {
  return new Response(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}
