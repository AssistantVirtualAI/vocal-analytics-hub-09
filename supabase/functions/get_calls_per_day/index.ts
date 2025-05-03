
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
  
  // Parse request parameters
  let days = 14; // Default to 14 days
  let agentId = '';
  
  try {
    const body = await req.json();
    days = body.days || 14;
    agentId = body.agentId || '';
    console.log(`Request parameters: days=${days}, agentId=${agentId}`);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Calculate the start date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`Fetching calls from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Get real data from the database
    const { data: calls, error } = await supabase
      .from("calls_view")
      .select("date, agent_id")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString());

    if (error) {
      console.error("Error fetching calls per day:", error);
      throw error;
    }

    // Initialize all days in our time range with zero calls
    const callsPerDay = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      callsPerDay[dateStr] = 0;
    }

    // If no data, return structure with zeros
    if (!calls || calls.length === 0) {
      console.log("No calls found in database");
      return new Response(JSON.stringify(callsPerDay), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter by agentId in memory if specified
    const filteredCalls = agentId ? 
      calls.filter(call => call.agent_id === agentId) : 
      calls;
    
    console.log(`Retrieved ${calls.length} calls, filtered to ${filteredCalls.length} for agent ${agentId}`);

    // If still no data after filtering, return structure with zeros
    if (filteredCalls.length === 0) {
      console.log("No calls found after filtering");
      return new Response(JSON.stringify(callsPerDay), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Count calls per day
    filteredCalls.forEach(call => {
      if (!call.date) return;
      const date = new Date(call.date).toISOString().split('T')[0];
      callsPerDay[date] = (callsPerDay[date] || 0) + 1;
    });
    
    console.log(`Generated data for ${Object.keys(callsPerDay).length} days`);

    return new Response(JSON.stringify(callsPerDay), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_calls_per_day function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Failed to retrieve calls per day"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
