
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./utils.ts";
import { calculateStats } from "./statsCalculator.ts";

/**
 * Main request handler for the get-stats function
 */
export async function handleRequest(req: Request): Promise<Response> {
  const startTime = performance.now();
  console.log("Edge function get-stats called");

  // Parse request body to get agentId
  let agentId = '';
  let orgSlug = '';
  try {
    const body = await req.json();
    agentId = body.agentId || '';
    orgSlug = body.orgSlug || '';
    console.log(`Received agentId: ${agentId}, orgSlug: ${orgSlug}`);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new Response(JSON.stringify({ 
      error: "Invalid request body", 
      message: "Failed to parse request" 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log(`Fetching calls data from the database...`);

    // If orgSlug is provided, get the organization's agent ID
    if (orgSlug && !agentId) {
      console.log(`Finding agent ID for organization slug: ${orgSlug}`);
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("agent_id")
        .eq("slug", orgSlug)
        .single();
        
      if (orgError) {
        console.error("Error fetching organization:", orgError);
        throw new Error(`Organization not found: ${orgSlug}`);
      }
      
      if (orgData) {
        agentId = orgData.agent_id;
        console.log(`Found agent ID ${agentId} for organization slug ${orgSlug}`);
      }
    }

    // Get real data from the database, specifically from the calls_view
    const { data: calls, error: callsError } = await supabase
      .from("calls_view")
      .select("*");

    if (callsError) {
      console.error("Error fetching calls:", callsError);
      throw callsError;
    }

    // If no data in the database, return empty stats
    if (!calls || calls.length === 0) {
      console.log("No calls found in database");
      return createEmptyStatsResponse();
    }

    // Filter calls by agentId if provided
    const filteredCalls = agentId ? calls.filter(call => call.agent_id === agentId) : calls;
    console.log(`Retrieved ${calls.length} calls from database, filtered to ${filteredCalls.length} for agent ${agentId}`);

    // If no calls after filtering, return empty stats
    if (filteredCalls.length === 0) {
      console.log("No calls found after filtering by agent");
      return createEmptyStatsResponse();
    }

    // Calculate stats from filtered calls
    const stats = calculateStats(filteredCalls);

    const endTime = performance.now();
    console.log(`Stats calculation completed in ${endTime - startTime}ms for agent ${agentId}`);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-stats function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Failed to retrieve statistics"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Creates a response with empty stats
 */
function createEmptyStatsResponse(): Response {
  return new Response(JSON.stringify({ 
    totalCalls: 0,
    avgDuration: 0,
    avgSatisfaction: 0,
    callsPerDay: {},
    topCustomers: []
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
