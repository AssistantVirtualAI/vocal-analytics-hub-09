
import { corsHeaders } from "./cors.ts";

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(options: { 
  status: number;
  message: string;
  code: string;
  details?: any;
}) {
  const { status, message, code, details } = options;
  
  return new Response(
    JSON.stringify({
      error: {
        message,
        code,
        details
      },
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  );
}

/**
 * Handles CORS preflight requests
 */
export function handleCorsOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Reports API metrics for monitoring
 * This is a stub function that could be expanded to actually report metrics
 */
export async function reportApiMetrics(
  functionName: string, 
  startTime: number,
  status: number,
  errorMessage?: string
): Promise<void> {
  // This is a stub function that could be expanded to actually report metrics
  // For now, we just log the metrics
  const duration = Date.now() - startTime;
  console.log(`[METRICS] Function: ${functionName}, Duration: ${duration}ms, Status: ${status}${errorMessage ? `, Error: ${errorMessage}` : ''}`);
}
