
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

  console.log("Edge function get-calls called");

  try {
    // Parse request parameters
    const {
      limit = 10,
      offset = 0,
      sort = 'date',
      order = 'desc',
      search = '',
      customerId = '',
      agentId = '',
      startDate = '',
      endDate = '',
    } = JSON.parse(await req.text());

    console.log(`Request parameters: limit=${limit}, offset=${offset}, sort=${sort}, agentId=${agentId}`);

    if (!agentId && !customerId) {
      console.log("Warning: No agentId or customerId specified, will return all calls");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Base query - no filtering by agent at database level
    let query = supabase.from("calls_view").select("*", { count: "exact" });
    
    // Apply date filters at database level
    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Apply customer filter at database level
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    // If search is specified, apply search filter at database level
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
    }
    
    // Execute the query to get all matching calls
    const { data: allCalls, error: queryError, count: totalCount } = await query;

    if (queryError) {
      console.error("Database query error:", queryError);
      throw queryError;
    }

    console.log(`Retrieved ${allCalls?.length || 0} calls from database before agent filtering`);

    // Filter by agentId in memory if specified
    const filteredCalls = agentId ? 
      allCalls.filter(call => call.agent_id === agentId) : 
      allCalls;
    
    const totalFilteredCount = filteredCalls.length;
    console.log(`Filtered to ${totalFilteredCount} calls for agent ${agentId}`);
    
    // Sort in memory
    filteredCalls.sort((a, b) => {
      const aValue = a[sort];
      const bValue = b[sort];
      
      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return order === 'asc' ? -1 : 1;
      if (bValue === null) return order === 'asc' ? 1 : -1;
      
      // Compare dates
      if (sort === 'date') {
        return order === 'asc' 
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }
      
      // Compare numbers or strings
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Default string comparison
      return order === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    
    // Apply pagination in memory
    const paginatedCalls = filteredCalls.slice(offset, offset + limit);
    
    console.log(`Returning ${paginatedCalls.length} calls after pagination`);

    // Clean up each call record and ensure all fields are present
    const formattedCalls = paginatedCalls.map(call => ({
      id: call.id,
      customer_id: call.customer_id || null,
      customer_name: call.customer_name || "Client inconnu",
      agent_id: call.agent_id || null,
      agent_name: call.agent_name || "Agent inconnu",
      date: call.date || new Date().toISOString(),
      duration: call.duration || 0,
      satisfaction_score: call.satisfaction_score || 0,
      audio_url: call.audio_url || "",
      summary: call.summary || "",
      transcript: call.transcript || "",
      tags: call.tags || []
    }));

    return new Response(JSON.stringify({
      calls: formattedCalls,
      count: totalFilteredCount
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in get-calls function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      calls: [],
      count: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
