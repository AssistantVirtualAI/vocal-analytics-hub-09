
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

  console.log("Edge function get_calls_per_day called");

  try {
    // Parse request body
    const body = await req.json();
    const days = body.days || 14; // Default to 14 days
    const agentId = body.agentId;

    if (!agentId) {
      return new Response(JSON.stringify({ 
        error: "Missing agentId parameter", 
        message: "Agent ID is required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing request for last ${days} days, agent ID: ${agentId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`Fetching calls from ${startDate.toISOString()} to ${endDate.toISOString()} for agent ${agentId}`);

    // Fetch all calls in date range - we'll filter by agent ID in memory
    const { data: calls, error } = await supabase
      .from("calls_view")
      .select("date, agent_id")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString());

    if (error) {
      throw error;
    }

    // Filter by agent ID in memory
    const filteredCalls = calls.filter(call => call.agent_id === agentId);
    console.log(`Retrieved ${calls.length} calls, filtered to ${filteredCalls.length} for agent ${agentId}`);

    // Group by day
    const callsPerDay = {};
    
    // Initialize all days in range with 0 calls
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      callsPerDay[dateStr] = 0;
    }

    // Count calls for each day
    filteredCalls.forEach(call => {
      if (!call.date) return;
      const dateStr = new Date(call.date).toISOString().split('T')[0];
      callsPerDay[dateStr] = (callsPerDay[dateStr] || 0) + 1;
    });

    return new Response(JSON.stringify(callsPerDay), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in get_calls_per_day function:", error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      message: "Failed to retrieve calls per day data" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
