
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handleCorsOptions } from "../_shared/cors-utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId } from "../_shared/agent-resolver/agent-lookup.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }
  
  try {
    console.log("Edge function get_calls_per_day called");
    
    // Parse request body
    let body: { days?: number; agentId?: string; timeRange?: string; startDate?: string; endDate?: string };
    
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          details: error instanceof Error ? error.message : "Unknown error" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check if agentId is provided
    const agentId = body.agentId;
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: "MISSING_PARAMETER - agentId is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get other parameters from body
    const days = body.days || 14;
    const timeRange = body.timeRange;
    const startDate = body.startDate;
    const endDate = body.endDate;
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Resolve the agent ID to an internal UUID if needed
    console.log(`Resolving agent ID: ${agentId}`);
    const internalAgentId = await getAgentUUIDByExternalId(supabase, agentId);
    
    if (!internalAgentId) {
      console.log(`Could not resolve agent ID: ${agentId}, creating a default response`);
      return new Response(
        JSON.stringify({
          callsPerDay: {},
          timeRange: {
            from: startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: endDate || new Date().toISOString().split('T')[0],
            days
          },
          total: 0,
          agentId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Resolved agent ID ${agentId} to internal UUID: ${internalAgentId}`);
    
    // Set up dates for filtering
    const now = new Date();
    let fromDate = new Date();
    fromDate.setDate(now.getDate() - days);
    
    // Override with explicit dates if provided
    if (startDate) {
      fromDate = new Date(startDate);
    }
    
    let toDate = now;
    if (endDate) {
      toDate = new Date(endDate);
    }
    
    // Format dates for SQL query
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    console.log(`Fetching calls from ${fromDateStr} to ${toDateStr} for agent ${internalAgentId}`);
    
    // Prepare query
    let query = supabase.from('calls').select('date');
    
    // Apply agent filter
    query = query.eq('agent_id', internalAgentId);
    
    // Apply date filter
    query = query.gte('date', fromDateStr).lte('date', toDateStr);
    
    // Execute query
    const { data: calls, error } = await query;
    
    if (error) {
      console.error("Error fetching calls:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process data
    const callsPerDay: Record<string, number> = {};
    
    // Initialize all dates in range with 0
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      callsPerDay[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count calls per day
    calls?.forEach(call => {
      const callDate = new Date(call.date);
      const dateStr = callDate.toISOString().split('T')[0];
      callsPerDay[dateStr] = (callsPerDay[dateStr] || 0) + 1;
    });
    
    // Prepare response
    const response = {
      callsPerDay,
      timeRange: {
        from: fromDateStr,
        to: toDateStr,
        days
      },
      total: calls?.length || 0,
      agentId
    };
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Unhandled error in get_calls_per_day function:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
