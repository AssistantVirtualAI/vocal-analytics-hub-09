
import { corsHeaders } from "./cors.ts";

export interface ErrorResponseOptions {
  status: number;
  message: string;
  code: string;
  details?: any;
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
        details
      }
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Creates a standardized success response with CORS headers
 */
export function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
