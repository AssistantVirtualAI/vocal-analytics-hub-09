
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./utils.ts";
import { calculateStats } from "./statsCalculator.ts";

/**
 * Helper function to get Agent UUID by matching with ID or name
 */
async function getAgentUUIDByExternalId(supabase: SupabaseClient, externalAgentId: string): Promise<string | null> {
  if (!externalAgentId) return null;
  
  console.log(`[get-stats] Looking up agent with ID matching: ${externalAgentId}`);
  
  // First try looking up by the ID directly in the agents table (in case it's already a UUID)
  try {
    const { data: directData, error: directError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", externalAgentId)
      .maybeSingle();
      
    if (!directError && directData) {
      console.log(`[get-stats] Found agent directly with ID: ${directData.id}`);
      return directData.id;
    }
  } catch (err) {
    console.log(`[get-stats] Direct ID lookup failed, will try alternative lookups: ${err}`);
    // This is expected if the ID is not a UUID, continue to next approach
  }
  
  // Try looking up the agent by name in the agents table
  try {
    const { data: nameData, error: nameError } = await supabase
      .from("agents")
      .select("id")
      .eq("name", externalAgentId)
      .maybeSingle();

    if (!nameError && nameData) {
      console.log(`[get-stats] Found agent by name: ${nameData.id}`);
      return nameData.id;
    }
    
    if (nameError) {
      console.log(`[get-stats] Error fetching agent by name: ${nameError.message || JSON.stringify(nameError)}`);
    }
  } catch (err) {
    console.log(`[get-stats] Name lookup failed: ${err}`);
    // Continue to next approach
  }
  
  // Try finding by agent_id in the organizations table
  try {
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (!orgError && orgData) {
      console.log(`[get-stats] Found organization with agent_id: ${externalAgentId}, using default agent`);
      // This is a special case - return a non-null value to indicate we should proceed with query
      // but without a specific agent filter
      return "USE_NO_FILTER";
    }
    
    if (orgError) {
      console.log(`[get-stats] Error checking organization table: ${orgError.message || JSON.stringify(orgError)}`);
    }
  } catch (err) {
    console.log(`[get-stats] Organization lookup failed: ${err}`);
  }
  
  console.warn(`[get-stats] No agent found with ID or name matching: ${externalAgentId}`);
  return null;
}

/**
 * Main request handler for the get-stats function
 */
export async function handleRequest(req: Request): Promise<Response> {
  const startTime = performance.now();
  console.log("Edge function get-stats called");

  let externalAgentId = null; // This will be the string ID like "QNdB45Jpgh06Hr67TzFO..."
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
    // try to find the corresponding agent UUID.
    if (externalAgentId) {
      agentUUID = await getAgentUUIDByExternalId(supabase, externalAgentId);
      if (!agentUUID) {
        console.warn(`[get-stats] Could not find an agent with ID or name matching ${externalAgentId}. Stats might be incomplete.`);
        // If we're passing an agent ID from the frontend that we expect to exist but doesn't,
        // we'll return empty stats to avoid showing incorrect data
        if (externalAgentId) {
          return new Response(JSON.stringify({ 
            totalCalls: 0, avgDuration: 0, avgSatisfaction: 0, callsPerDay: {}, topCustomers: [] 
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    console.log(`[get-stats] Fetching calls data from calls_view. Filtering by agentUUID: ${agentUUID}`);
    let query = supabase.from("calls_view").select("*");

    // Filter calls by the resolved agentUUID if available
    if (agentUUID && agentUUID !== "USE_NO_FILTER") {
      query = query.eq("agent_id", agentUUID); // agent_id in calls_view is UUID
    }

    const { data: calls, error: callsError } = await query;

    if (callsError) {
      console.error("[get-stats] Error fetching calls:", callsError);
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
