
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Helper function to get Agent UUID by matching with ID or name from the 'agents' table.
 */
async function getAgentUUIDByExternalId(supabase: SupabaseClient, externalAgentId: string): Promise<string | null> {
  if (!externalAgentId) {
    console.log("[get-calls HELPER] externalAgentId is empty or null. Returning null.");
    return null;
  }

  console.log(`[get-calls HELPER] Looking up agent with externalAgentId: ${externalAgentId}`);

  // Attempt 1: If externalAgentId is a UUID, try matching it against 'agents.id'
  if (uuidRegex.test(externalAgentId)) {
    console.log(`[get-calls HELPER] externalAgentId '${externalAgentId}' is a valid UUID format. Querying agents.id.`);
    try {
      const { data: agentById, error: errorById } = await supabase
        .from("agents")
        .select("id")
        .eq("id", externalAgentId)
        .maybeSingle();

      if (errorById && errorById.code !== 'PGRST116') { // PGRST116 means 0 rows, which is not an error for maybeSingle
        console.error(`[get-calls HELPER] Error querying agents by id '${externalAgentId}':`, errorById);
        // Do not return here, proceed to check by name as it might be a name that looks like a UUID
      } else if (agentById) {
        console.log(`[get-calls HELPER] Found agent by id: ${agentById.id}`);
        return agentById.id;
      }
    } catch (e) {
      console.error(`[get-calls HELPER] Exception during agent lookup by id '${externalAgentId}':`, e);
      // Proceed to check by name
    }
  }

  // Attempt 2: Try matching externalAgentId against 'agents.name'
  console.log(`[get-calls HELPER] Querying agents.name for '${externalAgentId}'.`);
  try {
    const { data: agentByName, error: errorByName } = await supabase
      .from("agents")
      .select("id")
      .eq("name", externalAgentId)
      .maybeSingle();

    if (errorByName && errorByName.code !== 'PGRST116') {
      console.error(`[get-calls HELPER] Error querying agents by name '${externalAgentId}':`, errorByName);
    } else if (agentByName) {
      console.log(`[get-calls HELPER] Found agent by name '${externalAgentId}', UUID: ${agentByName.id}`);
      return agentByName.id;
    }
  } catch (e) {
    console.error(`[get-calls HELPER] Exception during agent lookup by name '${externalAgentId}':`, e);
  }
  
  // If not found by ID or name, it might be an organization's agent_id (which is a string name for an agent)
  // This part of the original logic for "USE_NO_FILTER" was specific to a scenario where
  // an organization's agent_id might not directly map to an agent but still imply a filter context.
  // For fetching calls *for a specific agent*, if we haven't found a UUID, we should return null.
  // The 'USE_NO_FILTER' logic seems more applicable if the function was 'getOrgCalls' and agentId was optional.
  // Given the function is 'get-calls' and an agentId is provided, we expect to filter by that agent.

  console.warn(`[get-calls HELPER] No agent UUID found for externalAgentId '${externalAgentId}' in 'agents' table by id or name. Returning null.`);
  return null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[get-calls MAIN] Edge function 'get-calls' called.");

  try {
    const body = await req.json();
    const { 
      limit = 10, 
      offset = 0, 
      sort = 'date', 
      order = 'desc', 
      search = '', 
      customerId = '', 
      agentId: externalAgentIdFromRequest = '', // This is the string ID like 'QNdB45Jpgh06Hr67TzFO'
      startDate = '', 
      endDate = '' 
    } = body;

    console.log(`[get-calls MAIN] Request parameters: limit=${limit}, offset=${offset}, sort=${sort}, order=${order}, search='${search}', customerId='${customerId}', externalAgentIdFromRequest='${externalAgentIdFromRequest}', startDate='${startDate}', endDate='${endDate}'`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[get-calls MAIN] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let agentUUIDForQuery: string | null = null;

    if (externalAgentIdFromRequest) {
      console.log(`[get-calls MAIN] externalAgentIdFromRequest is '${externalAgentIdFromRequest}', attempting to get internal UUID.`);
      agentUUIDForQuery = await getAgentUUIDByExternalId(supabase, externalAgentIdFromRequest);
      console.log(`[get-calls MAIN] Result from getAgentUUIDByExternalId: '${agentUUIDForQuery}'`);

      if (!agentUUIDForQuery) {
        console.warn(`[get-calls MAIN] No agent UUID mapped for externalAgentIdFromRequest '${externalAgentIdFromRequest}'. Returning 200 with empty call list as per design for non-critical missing agent.`);
        // If an agent filter was specified but the agent doesn't exist, it means no calls for *that* agent.
        // Returning empty list is appropriate, not an error, unless the business logic dictates otherwise.
        return new Response(JSON.stringify({ calls: [], count: 0, message: `No agent found for identifier: ${externalAgentIdFromRequest}` }), {
          status: 200, // Changed from 404 to 200 as it's a valid query with no results for that filter
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.log("[get-calls MAIN] externalAgentIdFromRequest is empty. Proceeding without agent-specific UUID filter (will fetch calls for all agents unless other filters apply).");
    }

    let query = supabase.from("calls_view").select("*", { count: "exact" });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (customerId) query = query.eq('customer_id', customerId);
    
    if (agentUUIDForQuery) {
      console.log(`[get-calls MAIN] Applying filter: query.eq("agent_id", "${agentUUIDForQuery}")`);
      query = query.eq('agent_id', agentUUIDForQuery); // Filter by the resolved agent's UUID
    } else {
      // If externalAgentIdFromRequest was provided but no agentUUIDForQuery was found, we've already returned an empty list.
      // If externalAgentIdFromRequest was NOT provided, we don't filter by agent.
      console.log("[get-calls MAIN] No agentUUIDForQuery, so not applying agent_id filter.");
    }

    if (search) query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
    
    query = query.order(sort, { ascending: order === 'asc' });
    query = query.range(offset, offset + limit - 1);
    
    console.log("[get-calls MAIN] Executing final query on calls_view.");
    const { data: calls, error: queryError, count: totalCount } = await query;

    if (queryError) {
      console.error("[get-calls MAIN] Database query error occurred on calls_view:", queryError);
      // This is where the original 22P02 error would have happened if agentUUIDForQuery was a non-UUID string.
      // Now, if agentUUIDForQuery is null (agent not found), this query runs without agent filter (if externalAgentIdFromRequest was empty)
      // or we already returned an empty list (if externalAgentIdFromRequest was given but agent not found).
      // If agentUUIDForQuery is a valid UUID, the query should work.
      throw queryError;
    }

    console.log(`[get-calls MAIN] Successfully retrieved ${calls?.length || 0} calls. Total count: ${totalCount}`);
    
    const formattedCalls = calls?.map(call => ({
      id: call.id,
      customer_id: call.customer_id || null,
      customer_name: call.customer_name || "Client inconnu",
      agent_id: call.agent_id || null, 
      agent_name: call.agent_name || "Agent inconnu",
      date: call.date || new Date().toISOString(),
      duration: call.duration || 0,
      satisfaction_score: call.satisfaction_score || 0,
      audio_url: call.audio_url || "",
      summary: call.summary || "",
      transcript: call.transcript || "",
      tags: call.tags || []
    })) || [];

    return new Response(JSON.stringify({
      calls: formattedCalls,
      count: totalCount || formattedCalls.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[get-calls MAIN] CATCH BLOCK: Unhandled error:", error);
    let errorStatus = 500;
    if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') {
      errorStatus = error.status;
    }
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred in get-calls main catch block.",
      message: error.message || "An unexpected error occurred in get-calls main catch block."
    }), {
      status: errorStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
