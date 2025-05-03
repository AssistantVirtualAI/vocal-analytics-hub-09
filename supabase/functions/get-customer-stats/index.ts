
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

  console.log("Edge function get-customer-stats called");

  // Parse request body to get agentId
  let agentId = '';
  try {
    const body = await req.json();
    agentId = body.agentId;
    console.log(`Received agentId: ${agentId}`);
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
    // Get customers data
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("*");

    if (customersError) {
      console.error("Error fetching customers:", customersError);
      throw customersError;
    }

    console.log(`Retrieved ${customers?.length || 0} customers from database`);

    // Get calls - no filtering by agent at database level to avoid UUID type issues
    const { data: calls, error: callsError } = await supabase
      .from("calls_view")
      .select("*");

    if (callsError) {
      console.error("Error fetching calls:", callsError);
      throw callsError;
    }

    console.log(`Retrieved ${calls?.length || 0} calls from database`);

    // Filter calls by agentId in memory
    const filteredCalls = agentId ? calls.filter(call => call.agent_id === agentId) : calls;
    
    console.log(`Filtered to ${filteredCalls.length} calls for agent ${agentId}`);

    // Calculate customer stats
    const customerStats = customers.map(customer => {
      const customerCalls = filteredCalls.filter(call => call.customer_id === customer.id);
      const totalCalls = customerCalls.length;
      
      // Calculate averages
      const totalDuration = customerCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
      const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
      
      const totalSatisfaction = customerCalls.reduce((sum, call) => sum + (call.satisfaction_score || 0), 0);
      const avgSatisfaction = totalCalls > 0 ? totalSatisfaction / totalCalls : 0;
      
      // Find last call date
      const lastCallDate = customerCalls.length > 0 
        ? customerCalls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : null;
      
      return {
        customerId: customer.id,
        customerName: customer.name,
        totalCalls,
        avgDuration,
        avgSatisfaction,
        lastCallDate
      };
    });

    // Sort by total calls
    customerStats.sort((a, b) => b.totalCalls - a.totalCalls);
    
    console.log(`Returning stats for ${customerStats.length} customers`);

    return new Response(JSON.stringify(customerStats), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-customer-stats function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Failed to retrieve customer statistics" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
