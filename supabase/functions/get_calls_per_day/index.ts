
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseEnvVars } from "../_shared/env.ts";
import { createErrorResponse, createSuccessResponse, handleCorsOptions } from "../_shared/api-utils.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
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
      return createErrorResponse({
        status: 400,
        message: "agentId is required",
        code: "MISSING_PARAMETER"
      });
    }

    const { supabaseUrl, supabaseServiceKey } = getSupabaseEnvVars();
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
      return createErrorResponse({
        status: 500,
        message: queryError.message || "Database query error",
        code: "DATABASE_ERROR" 
      });
    }

    console.log(`Retrieved ${calls?.length || 0} calls from database`);
    
    if (!calls || calls.length === 0) {
      return createSuccessResponse([]);
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

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error in get_calls_per_day function:", error);
    return createErrorResponse({
      status: 500,
      message: error.message || "An unexpected error occurred",
      code: "SERVER_ERROR" 
    });
  }
});
