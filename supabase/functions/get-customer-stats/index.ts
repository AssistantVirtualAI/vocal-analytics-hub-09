
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

    if (!customers || customers.length === 0) {
      console.log("No customers found in database");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get calls data filtered by agent if applicable
    let query = supabase.from("calls_view").select("*");
    
    // Modified: Check if agentId matches a UUID pattern before using it in a query
    // This prevents SQL errors when using non-UUID strings with UUID columns
    if (agentId) {
      // Check if agentId is associated with an organization
      const { data: orgCheck } = await supabase
        .from("organizations")
        .select("id")
        .eq("agent_id", agentId)
        .maybeSingle();
      
      if (orgCheck?.id) {
        // If found in organizations, filter by organization_id
        query = query.eq("organization_id", orgCheck.id);
        console.log(`Found organization with agent_id: ${agentId}, filtering by organization_id: ${orgCheck.id}`);
      } else {
        // Check if this is a real agent UUID in the agents table
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(agentId)) {
          // If it matches UUID pattern, use it directly
          query = query.eq("agent_id", agentId);
          console.log(`Using agent_id as UUID filter: ${agentId}`);
        } else {
          // For non-UUID ElevenLabs IDs that aren't in organizations, use external_id field
          query = query.eq("agent_external_id", agentId);
          console.log(`Using agent_external_id filter for non-UUID: ${agentId}`);
        }
      }
    }
    
    const { data: calls, error: callsError } = await query;

    if (callsError) {
      console.error("Error fetching calls:", callsError);
      throw callsError;
    }

    console.log(`Retrieved ${calls?.length || 0} calls from database`);

    if (!calls || calls.length === 0) {
      console.log("No calls found in database, returning empty customer stats");
      const emptyCustomerStats = customers.map(customer => ({
        customerId: customer.id,
        customerName: customer.name,
        totalCalls: 0,
        avgDuration: 0,
        avgSatisfaction: 0,
        lastCallDate: null
      }));
      
      return new Response(JSON.stringify(emptyCustomerStats), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate customer stats
    const customerStats = customers.map(customer => {
      const customerCalls = calls.filter(call => call.customer_id === customer.id);
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
