
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    if (!agentId) {
      return new Response(JSON.stringify({ 
        error: "Missing agentId parameter", 
        message: "Agent ID is required",
        calls: [],
        count: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Base query without agentId filter (since it's not a UUID)
    let query = supabase
      .from("calls_view")
      .select("*", { count: "exact" });
    
    // Apply other filters (except agentId)
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Order by specified field
    query = query.order(sort, { ascending: order === 'asc' });

    // Execute query to get all calls (without pagination yet)
    const { data: allCalls, error, count } = await query;

    if (error) {
      console.error("Database query error:", error);
      throw error;
    }

    // Filter by agentId in memory
    const filteredCalls = allCalls.filter(call => call.agent_id === agentId);
    const totalFilteredCount = filteredCalls.length;
    
    // Apply pagination in memory
    const paginatedCalls = filteredCalls.slice(offset, offset + limit);

    console.log(`Retrieved ${allCalls.length} total calls, filtered to ${totalFilteredCount} for agent ${agentId}, returning ${paginatedCalls.length} after pagination`);

    return new Response(JSON.stringify({
      calls: paginatedCalls,
      count: totalFilteredCount
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
