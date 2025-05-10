
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./utils.ts";
import { calculateStats } from "./statsCalculator.ts";

/**
 * Helper function to get Agent UUID from an external string ID.
 * Assumes the string ID is stored in a column like 'external_id' in the 'agents' table.
 */
async function getAgentUUIDByExternalId(supabase: SupabaseClient, externalAgentId: string): Promise<string | null> {
  if (!externalAgentId) return null;
  console.log(`[get-stats] Fetching UUID for externalAgentId: ${externalAgentId}`);
  const { data: agentData, error: agentError } = await supabase
    .from("agents") // Your agents table
    .select("id")     // The UUID column in agents table
    .eq("external_id", externalAgentId) // The column storing string IDs like "QNdB45Jpgh..."
    .single();

  if (agentError) {
    console.error(`[get-stats] Error fetching agent UUID for external_id ${externalAgentId}:`, agentError);
    return null;
  }
  if (!agentData) {
    console.warn(`[get-stats] No agent found with external_id: ${externalAgentId}`);
    return null;
  }
  console.log(`[get-stats] Found agent UUID: ${agentData.id} for externalAgentId: ${externalAgentId}`);
  return agentData.id; // This is the UUID
}

/**
 * Main request handler for the get-stats function
 */
export async function handleRequest(req: Request): Promise<Response> {
  const startTime = performance.now();
  console.log("Edge function get-stats called");

  let externalAgentId = null; // This will be the string ID like "QNdB45Jpgh..."
  let orgSlug = null;

  try {
    const body = await req.json();
    // The agentId coming from the frontend is the string ID (e.g., ElevenLabs key or custom ID)
    externalAgentId = body.agentId || null;
    orgSlug = body.orgSlug || null;
    console.log(`[get-stats] Received externalAgentId: ${externalAgentId}, orgSlug: ${orgSlug}`);
  } catch (error) {
    console.error("[get-stats] Error parsing request body:", error);
    return new Response(JSON.stringify({ 
      error: "Invalid request body", 
      message: "Failed to parse request" 
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let agentUUID: string | null = null;

  try {
    // If orgSlug is provided, it takes precedence to find the externalAgentId
    if (orgSlug) {
      console.log(`[get-stats] Finding organization's agent_id (external) for slug: ${orgSlug}`);
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("agent_id") // This agent_id from organizations table is the string/external ID
        .eq("slug", orgSlug)
        .single();
        
      if (orgError) {
        console.error("[get-stats] Error fetching organization by slug:", orgError);
        throw new Error(`Organization not found for slug: ${orgSlug}`);
      }
      if (orgData && orgData.agent_id) {
        externalAgentId = orgData.agent_id;
        console.log(`[get-stats] Found externalAgentId ${externalAgentId} for organization slug ${orgSlug}`);
      } else {
        console.warn(`[get-stats] Organization slug ${orgSlug} found, but no agent_id associated.`);
        // Proceed without agent filtering if org has no agent_id, or handle as error if required
      }
    }

    // Now, if we have an externalAgentId (either from request body or from orgSlug lookup),
    // get the actual agent UUID from the "agents" table.
    if (externalAgentId) {
      agentUUID = await getAgentUUIDByExternalId(supabase, externalAgentId);
      if (!agentUUID) {
        console.warn(`[get-stats] Could not map externalAgentId ${externalAgentId} to an agent UUID. Stats might be incomplete or for all agents if no UUID found.`);
        // Depending on requirements, you might want to return an error or empty stats here
        // if an agentId was provided but couldn't be mapped.
        // For now, if mapping fails, we proceed to fetch general stats or stats for no specific agent.
      }
    }

    console.log(`[get-stats] Fetching calls data from calls_view. Filtering by agentUUID: ${agentUUID}`);
    let query = supabase.from("calls_view").select("*");

    // Filter calls by the resolved agentUUID if available
    if (agentUUID) {
      query = query.eq("agent_id", agentUUID); // agent_id in calls_view is UUID
    }
    // Note: If no agentUUID is found/resolved, this will fetch stats for ALL calls.
    // Adjust if stats should ONLY be for a specific agent if externalAgentId was given.

    const { data: calls, error: callsError } = await query;

    if (callsError) {
      console.error("[get-stats] Error fetching calls:", callsError);
      // Check for specific UUID error again, though mapping should prevent it if external_id exists
      if (callsError.code === "22P02") {
         console.error("[get-stats] UUID syntax error still occurred. Check agent_id in calls_view and mapping logic.");
      }
      throw callsError;
    }

    if (!calls || calls.length === 0) {
      console.log(`[get-stats] No calls found in database for agentUUID: ${agentUUID} (externalId: ${externalAgentId})`);
      return new Response(JSON.stringify({ 
        totalCalls: 0, avgDuration: 0, avgSatisfaction: 0, callsPerDay: {}, topCustomers: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[get-stats] Retrieved ${calls.length} calls for agentUUID ${agentUUID}. Calculating stats.`);
    const stats = calculateStats(calls);

    const endTime = performance.now();
    console.log(`[get-stats] Stats calculation completed in ${endTime - startTime}ms for agentUUID ${agentUUID} (externalId: ${externalAgentId})`);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[get-stats] Error in get-stats function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Failed to retrieve statistics"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
