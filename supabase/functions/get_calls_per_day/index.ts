
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
    const { days = 14, agentId = '' } = await req.json();
    
    console.log(`Processing request for last ${days} days, agent ID: ${agentId}`);
    
    if (!agentId) {
      console.warn("No agentId provided in request");
      return new Response(JSON.stringify({ 
        error: "Missing agentId parameter", 
        message: "Agent ID is required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    console.log(`Fetching calls from ${startDate.toISOString()} to ${endDate.toISOString()} for agent ${agentId}`);

    // Query calls within date range but without the agent_id filter
    const { data: calls, error } = await supabase
      .from("calls_view")
      .select("date, agent_id")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date", { ascending: true });

    if (error) {
      console.error("Database query error:", error);
      throw error;
    }

    // Filter by agentId in memory
    const filteredCalls = calls.filter(call => call.agent_id === agentId);
    console.log(`Retrieved ${calls.length} calls, filtered to ${filteredCalls.length} for agent ${agentId}`);

    // Initialize callsPerDay with all dates in range (including zeros)
    const callsPerDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      callsPerDay[dateStr] = 0;
    }

    // Count calls per day from filtered calls
    filteredCalls.forEach((call) => {
      const dateStr = new Date(call.date).toISOString().split("T")[0];
      callsPerDay[dateStr] = (callsPerDay[dateStr] || 0) + 1;
    });

    return new Response(JSON.stringify(callsPerDay), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
