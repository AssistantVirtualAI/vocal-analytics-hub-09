
import { corsHeaders } from "../_shared/cors.ts";
import { FormattedCall } from "./types.ts";

/**
 * Create a success response with calls data
 */
export function createSuccessResponse(calls: FormattedCall[], totalCount: number | null, message?: string): Response {
  return new Response(
    JSON.stringify({
      calls,
      count: totalCount || calls.length,
      ...(message && { message })
    }), 
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create an error response
 */
export function createErrorResponse(error: Error | any, status: number = 500): Response {
  console.error("Error in get-calls:", error);
  
  let errorStatus = status;
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') {
    errorStatus = error.status;
  }
  
  return new Response(
    JSON.stringify({ 
      error: error.message || "An unexpected error occurred in get-calls.",
      message: error.message || "An unexpected error occurred in get-calls."
    }), 
    {
      status: errorStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create an empty calls response (when no agent found)
 */
export function createEmptyCallsResponse(agentId: string): Response {
  return createSuccessResponse([], 0, `No agent found for identifier: ${agentId}`);
}
