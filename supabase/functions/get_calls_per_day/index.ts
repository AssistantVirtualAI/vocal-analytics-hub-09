
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId, createServiceClient } from "../_shared/agent-resolver.ts";
import { createErrorResponse, createSuccessResponse, handleCorsOptions, handleApiError } from "../_shared/api-utils.ts";

serve(async (req) => {
  const startTime = Date.now();
  const functionName = "get_calls_per_day";

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

    const supabase = createServiceClient();
    
    // Résoudre l'ID de l'agent externe en UUID
    const resolvedAgentId = await getAgentUUIDByExternalId(supabase, agentId);
    
    if (!resolvedAgentId) {
      console.warn(`No agent found with ID or name matching: ${agentId}`);
      return createSuccessResponse([]);
    }

    // Prepare the query to get calls per day
    let query = supabase.from("calls").select("date");
    
    // Filter by agent ID if we have a valid UUID
    if (resolvedAgentId !== "USE_NO_FILTER") {
      query = query.eq("agent_id", resolvedAgentId);
    } else {
      console.log(`Using no agent filter as ${agentId} is an organization's agent ID`);
      // For organizations, we might add additional filtering if needed
    }
    
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
    return await handleApiError(error, functionName, startTime);
  }
});
