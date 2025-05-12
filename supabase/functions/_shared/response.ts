
import { corsHeaders } from "./cors.ts";

/**
 * Helper to create consistent success responses
 * @param data - The data to include in the response
 * @param status - The HTTP status code (defaults to 200)
 * @param headers - Optional additional headers
 */
export function createSuccessResponse(data: any, status = 200, headers = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...headers
      }
    }
  );
}

/**
 * Helper to create consistent error responses
 * @param options - Error response options
 */
export function createErrorResponse(options: ErrorResponseOptions = {}) {
  const {
    message = "An unexpected error occurred",
    status = 500,
    code = "INTERNAL_SERVER_ERROR",
    details
  } = options;

  console.error(`Error: ${code} - ${message}${details ? ` - Details: ${JSON.stringify(details)}` : ''}`);
  
  const errorBody: any = {
    error: {
      message,
      code
    }
  };

  if (details) {
    errorBody.error.details = details;
  }
  
  return new Response(
    JSON.stringify(errorBody),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

export interface ErrorResponseOptions {
  message?: string;
  status?: number;
  code?: string;
  details?: any;
}
