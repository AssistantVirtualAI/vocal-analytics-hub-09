
// Define CORS headers directly in this file to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

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
