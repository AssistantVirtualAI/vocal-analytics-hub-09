
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

  const startTime = performance.now();
  console.log("Edge function get-stats called");

  // Parse request body to get agentId
  let agentId = '';
  try {
    const body = await req.json();
    agentId = body.agentId;
    console.log(`Received agentId: ${agentId}`);
    
    if (!agentId) {
      return new Response(JSON.stringify({ 
        error: "Missing agentId parameter", 
        message: "Agent ID is required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log(`Fetching calls data for agent: ${agentId}`);

    // Get call stats but without filtering by agent_id in the SQL query
    // We'll filter in memory after fetching
    const { data: calls, error: callsError } = await supabase
      .from("calls_view")
      .select("duration, satisfaction_score, date, customer_id, customer_name, agent_id, agent_name");

    if (callsError) {
      console.error("Error fetching calls:", callsError);
      throw callsError;
    }

    // Filter calls by agentId in memory
    const filteredCalls = calls.filter(call => call.agent_id === agentId);
    console.log(`Retrieved ${calls.length} calls, filtered to ${filteredCalls.length} for agent ${agentId}`);

    // Calculate stats from filtered calls
    const totalCalls = filteredCalls.length;
    const totalDuration = filteredCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    
    const totalSatisfaction = filteredCalls.reduce((sum, call) => sum + (call.satisfaction_score || 0), 0);
    const avgSatisfaction = totalCalls > 0 ? totalSatisfaction / totalCalls : 0;
    
    // Group calls by date
    const callsPerDay = {};
    filteredCalls.forEach(call => {
      if (!call.date) return;
      const date = new Date(call.date).toISOString().split('T')[0];
      callsPerDay[date] = (callsPerDay[date] || 0) + 1;
    });

    // Get top customers
    const customerStatsMap = {};
    filteredCalls.forEach(call => {
      if (!call.customer_id) return;
      
      if (!customerStatsMap[call.customer_id]) {
        customerStatsMap[call.customer_id] = {
          customerId: call.customer_id,
          customerName: call.customer_name,
          totalCalls: 0,
          totalDuration: 0,
          totalSatisfaction: 0,
        };
      }
      
      customerStatsMap[call.customer_id].totalCalls += 1;
      customerStatsMap[call.customer_id].totalDuration += call.duration || 0;
      customerStatsMap[call.customer_id].totalSatisfaction += call.satisfaction_score || 0;
    });

    const topCustomers = Object.values(customerStatsMap)
      .map((stat: any) => ({
        ...stat,
        avgDuration: stat.totalCalls > 0 ? stat.totalDuration / stat.totalCalls : 0,
        avgSatisfaction: stat.totalCalls > 0 ? stat.totalSatisfaction / stat.totalCalls : 0,
      }))
      .sort((a: any, b: any) => b.totalCalls - a.totalCalls)
      .slice(0, 5);

    const stats = {
      totalCalls,
      avgDuration,
      avgSatisfaction,
      callsPerDay,
      topCustomers
    };

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
});
