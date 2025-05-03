
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
      query = query.eq('agent_id', agentId);
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
