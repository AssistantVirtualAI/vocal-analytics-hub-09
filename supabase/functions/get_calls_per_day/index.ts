
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { agentId, days = 14, startDate, endDate } = body;
    
    // Validate required parameters
    if (!agentId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "MISSING_PARAMETER",
            message: "agentId is required"
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: { 
            code: "SERVER_CONFIGURATION_ERROR", 
            message: "Server configuration error"
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Calculate date range
    let fromDate = new Date();
    if (startDate) {
      fromDate = new Date(startDate);
    } else {
      fromDate.setDate(fromDate.getDate() - days);
    }
    
    const toDate = endDate ? new Date(endDate) : new Date();
    
    // Format dates for SQL query
    const fromDateFormatted = fromDate.toISOString().split('T')[0];
    const toDateFormatted = toDate.toISOString().split('T')[0];
    
    console.log(`Fetching calls per day for agent ${agentId} from ${fromDateFormatted} to ${toDateFormatted}`);
    
    // Query database to get calls per day
    const { data, error } = await supabase
      .from('calls')
      .select('date')
      .eq('agent_id', agentId)
      .gte('date', fromDateFormatted)
      .lte('date', toDateFormatted);
    
    if (error) {
      console.error("Database query error:", error);
      return new Response(
        JSON.stringify({ 
          error: { 
            code: "DATABASE_ERROR", 
            message: error.message 
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Process the results to get count per day
    const callsPerDay: Record<string, number> = {};
    
    // Initialize all days in the range with 0 calls
    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      callsPerDay[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count calls for each day
    if (data && data.length > 0) {
      data.forEach((call: any) => {
        const dateKey = new Date(call.date).toISOString().split('T')[0];
        callsPerDay[dateKey] = (callsPerDay[dateKey] || 0) + 1;
      });
    }
    
    return new Response(
      JSON.stringify(callsPerDay),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: { 
          code: "INTERNAL_ERROR", 
          message: error instanceof Error ? error.message : "An unexpected error occurred" 
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
