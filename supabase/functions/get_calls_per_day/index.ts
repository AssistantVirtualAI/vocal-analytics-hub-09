
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
    // Parse request parameters
    const {
      agentId,
      startDate,
      endDate,
    } = JSON.parse(await req.text());

    console.log(`Request parameters: agentId=${agentId}, startDate=${startDate}, endDate=${endDate}`);

    if (!agentId) {
      throw new Error("agentId is required");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare the query to get calls per day
    let query = supabase.from("calls")
      .select("date")
      .eq("agent_id", agentId);
    
    // Apply date filters if provided
    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', `${endDate}T23:59:59`);
    }
    
    const { data: calls, error: queryError } = await query;

    if (queryError) {
      console.error("Database query error:", queryError);
      throw queryError;
    }

    console.log(`Retrieved ${calls?.length || 0} calls from database`);
    
    if (!calls || calls.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group calls by day and count them
    const callsByDay = calls.reduce((acc, call) => {
      // Extract just the date part (YYYY-MM-DD)
      const dateOnly = new Date(call.date).toISOString().split('T')[0];
      
      if (!acc[dateOnly]) {
        acc[dateOnly] = 0;
      }
      
      acc[dateOnly]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to array format for the chart
    const result = Object.entries(callsByDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in get_calls_per_day function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      data: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
