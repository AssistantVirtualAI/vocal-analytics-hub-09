
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Fetching calls data");

    // Get call stats with optimized query
    const { data: calls, error: callsError } = await supabase
      .from("calls_view")
      .select("duration, satisfaction_score, date, customer_id, customer_name")
      .order('date', { ascending: false })
      .limit(100); // Limit results for performance

    if (callsError) {
      console.error("Error fetching calls:", callsError);
      throw callsError;
    }

    console.log(`Retrieved ${calls.length} calls`);

    // Calculate stats
    const totalCalls = calls.length;
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    
    const totalSatisfaction = calls.reduce((sum, call) => sum + (call.satisfaction_score || 0), 0);
    const avgSatisfaction = totalCalls > 0 ? totalSatisfaction / totalCalls : 0;
    
    // Group calls by date (more efficient)
    const callsPerDay = {};
    calls.forEach(call => {
      if (!call.date) return;
      const date = new Date(call.date).toISOString().split('T')[0];
      callsPerDay[date] = (callsPerDay[date] || 0) + 1;
    });

    // Get top customers (more efficient)
    const customerStatsMap = {};
    calls.forEach(call => {
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
    console.log(`Stats calculation completed in ${endTime - startTime}ms`);

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
