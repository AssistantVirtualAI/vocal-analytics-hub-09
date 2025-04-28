
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get call stats
    const { data: calls, error: callsError } = await supabase
      .from("calls_view")
      .select("*");

    if (callsError) throw callsError;

    // Calculate stats
    const totalCalls = calls.length;
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    
    const totalSatisfaction = calls.reduce((sum, call) => sum + (call.satisfaction_score || 0), 0);
    const avgSatisfaction = totalCalls > 0 ? totalSatisfaction / totalCalls : 0;
    
    // Group calls by date
    const callsPerDay = calls.reduce((acc, call) => {
      if (!call.date) return acc;
      const date = new Date(call.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Get top customers
    const customerStats = {};
    calls.forEach(call => {
      if (!call.customer_id) return;
      
      if (!customerStats[call.customer_id]) {
        customerStats[call.customer_id] = {
          customerId: call.customer_id,
          customerName: call.customer_name,
          totalCalls: 0,
          totalDuration: 0,
          totalSatisfaction: 0,
        };
      }
      
      customerStats[call.customer_id].totalCalls += 1;
      customerStats[call.customer_id].totalDuration += call.duration || 0;
      customerStats[call.customer_id].totalSatisfaction += call.satisfaction_score || 0;
    });

    const topCustomers = Object.values(customerStats).map((stat: any) => ({
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

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-stats function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
