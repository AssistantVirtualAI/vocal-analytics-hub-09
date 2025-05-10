
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Helper function to get Agent UUID by matching with ID or name
 */
async function getAgentUUIDByExternalId(supabase, externalAgentId) {
  if (!externalAgentId) return null;
  
  console.log(`[get-calls] Looking up agent with ID matching: ${externalAgentId}`);
  
  // First try looking up by the ID directly in the agents table (in case it's already a UUID)
  try {
    const { data: directData, error: directError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", externalAgentId)
      .maybeSingle();
      
    if (!directError && directData) {
      console.log(`[get-calls] Found agent directly with ID: ${directData.id}`);
      return directData.id;
    }
  } catch (err) {
    console.log(`[get-calls] Direct ID lookup failed, will try alternative lookups: ${err}`);
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
      console.log(`[get-calls] Found agent by name: ${nameData.id}`);
      return nameData.id;
    }
    
    if (nameError) {
      console.log(`[get-calls HELPER] Error fetching agent by name ${externalAgentId}: ${JSON.stringify(nameError)}`);
    }
  } catch (err) {
    console.log(`[get-calls] Name lookup failed: ${err}`);
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
      console.log(`[get-calls] Found organization with agent_id: ${externalAgentId}, using default agent`);
      // This is a special case - return a non-null value to indicate we should proceed with query
      // but without a specific agent filter
      return "USE_NO_FILTER";
    }
    
    if (orgError) {
      console.log(`[get-calls] Error checking organization table: ${orgError.message || JSON.stringify(orgError)}`);
    }
  } catch (err) {
    console.log(`[get-calls] Organization lookup failed: ${err}`);
  }
  
  console.warn(`[get-calls MAIN] No agent UUID mapped for stringAgentId '${externalAgentId}'. Returning 200 with empty call list.`);
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Edge function get-calls called");

  try {
    // Parse request parameters
    const {
      limit = 10,
      offset = 0,
      sort = 'date',
      order = 'desc',
      search = '',
      customerId = '',
      agentId = '',
      startDate = '',
      endDate = '',
    } = JSON.parse(await req.text());

    console.log(`Request parameters: limit=${limit}, offset=${offset}, sort=${sort}, agentId=${agentId}`);

    if (!agentId && !customerId) {
      console.log("Warning: No agentId or customerId specified, will return all calls");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query directly on the calls_view to get real data from the database
    let query = supabase.from("calls_view").select("*", { count: "exact" });
    
    // Apply date filters
    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Apply customer filter
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    // Apply agent filter
    if (agentId) {
      const agentUUID = await getAgentUUIDByExternalId(supabase, agentId);
      if (agentUUID) {
        if (agentUUID !== "USE_NO_FILTER") {
          console.log(`[get-calls] Using resolved agent UUID: ${agentUUID}`);
          query = query.eq('agent_id', agentUUID);
        } else {
          console.log(`[get-calls] Using no agent filter as this is an organization's agent ID`);
          // Don't apply an agent filter in this case
        }
      } else {
        console.warn(`[get-calls] No agent UUID found for agentId ${agentId}. Returning empty call list.`);
        return new Response(JSON.stringify({
          calls: [],
          count: 0
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute the query
    const { data: calls, error: queryError, count: totalCount } = await query;

    if (queryError) {
      console.error("Database query error:", queryError);
      throw queryError;
    }

    console.log(`Retrieved ${calls?.length || 0} calls from database`);
    
    if (!calls || calls.length === 0) {
      return new Response(JSON.stringify({
        calls: [],
        count: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up each call record to ensure consistent formatting
    const formattedCalls = calls.map(call => ({
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
    }));

    return new Response(JSON.stringify({
      calls: formattedCalls,
      count: totalCount || formattedCalls.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in get-calls function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      calls: [],
      count: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
