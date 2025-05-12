
import { corsHeaders } from "./cors.ts";

/**
 * Handles API errors and returns a standardized error response
 */
export async function handleApiError(error: unknown, functionName: string, startTime?: number): Promise<Response> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const duration = startTime ? `${Date.now() - startTime}ms` : "unknown";
  
  console.error(`Error in ${functionName} after ${duration}:`, errorMessage);
  
  return new Response(
    JSON.stringify({
      error: {
        message: "An internal server error occurred",
        code: "INTERNAL_SERVER_ERROR",
        details: errorMessage
      }
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
