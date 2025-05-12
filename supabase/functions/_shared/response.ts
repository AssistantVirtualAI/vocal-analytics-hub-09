
import { corsHeaders } from "./cors.ts";

export interface ErrorResponseOptions {
  status: number;
  message: string;
  code: string;
  details?: string | Record<string, unknown>;
}

/**
 * Creates a standardized success response with CORS headers
 */
export function createSuccessResponse<T>(data: T): Response {
  return new Response(
    JSON.stringify({ data }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}

/**
 * Creates a standardized error response with CORS headers
 */
export function createErrorResponse(options: ErrorResponseOptions): Response {
  const { status, message, code, details } = options;
  
  return new Response(
    JSON.stringify({
      error: {
        message,
        code,
        ...(details ? { details } : {})
      }
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    }
  );
}
