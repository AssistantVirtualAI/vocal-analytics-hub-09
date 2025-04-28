
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, error } = await req.supabaseClient
      .from('calls_view')
      .select(`
        customer_id,
        customer_name,
        duration,
        satisfaction_score
      `)
      .order('date', { ascending: false });

    if (error) throw error;

    const customerStats = data.reduce((acc: any, call) => {
      if (!acc[call.customer_id]) {
        acc[call.customer_id] = {
          customer_id: call.customer_id,
          customer_name: call.customer_name,
          total_calls: 0,
          total_duration: 0,
          total_satisfaction: 0,
        };
      }

      acc[call.customer_id].total_calls += 1;
      acc[call.customer_id].total_duration += call.duration;
      acc[call.customer_id].total_satisfaction += call.satisfaction_score || 0;

      return acc;
    }, {});

    const result = Object.values(customerStats).map((stat: any) => ({
      ...stat,
      avg_duration: stat.total_duration / stat.total_calls,
      avg_satisfaction: stat.total_satisfaction / stat.total_calls,
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
