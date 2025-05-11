
import { corsHeaders } from './cors.ts';

/**
 * Standard response format for errors
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

/**
 * Standard response format for success
 */
export interface SuccessResponse<T = any> {
  data: T;
  meta?: Record<string, any>;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse({
  message,
  code = "INTERNAL_SERVER_ERROR",
  status = 500,
  details = undefined
}: {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}): Response {
  console.error(`Error: ${code} - ${message}`);
  
  const response: ErrorResponse = {
    error: {
      code,
      message
    },
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return new Response(
    JSON.stringify(response),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  meta?: Record<string, any>,
  status = 200
): Response {
  const response: SuccessResponse<T> = { data };
  
  if (meta) {
    response.meta = meta;
  }
  
  return new Response(
    JSON.stringify(response),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsOptions(): Response {
  return new Response(null, {
    status: 204, // No content
    headers: corsHeaders
  });
}

/**
 * Handle and format API errors
 */
export async function handleApiError(
  error: any,
  functionName: string,
  startTime: number
): Promise<Response> {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Log detailed error information
  console.error(`Error in ${functionName} after ${duration}ms:`, error);
  
  let status = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = error instanceof Error ? error.message : "An unexpected error occurred";
  
  // Handle specific error types
  if (error.code === "ELEVENLABS_AUTH_ERROR") {
    status = 401;
    code = "ELEVENLABS_AUTH_ERROR";
  } else if (error.code === "ELEVENLABS_NOT_FOUND") {
    status = 404;
    code = "ELEVENLABS_NOT_FOUND";
  } else if (error.code === "ELEVENLABS_QUOTA_EXCEEDED") {
    status = 429;
    code = "ELEVENLABS_QUOTA_EXCEEDED";
  } else if (error.code === "BAD_REQUEST") {
    status = 400;
    code = "BAD_REQUEST";
  } else if (error.code === "NOT_FOUND") {
    status = 404;
    code = "NOT_FOUND";
  }
  
  try {
    // Attempt to include detailed error information
    const details: Record<string, any> = {};
    
    if (error.stack) {
      details.stack = error.stack;
    }
    
    if (error.cause) {
      details.cause = String(error.cause);
    }
    
    // Log final error details
    console.error({
      status,
      code,
      message,
      details,
      duration
    });
    
    return createErrorResponse({
      message,
      code,
      status,
      details
    });
  } catch (formatError) {
    console.error("Error formatting error response:", formatError);
    
    // Fallback to simplified error response
    return createErrorResponse({
      message: "An unexpected error occurred while processing the error response",
      code: "INTERNAL_SERVER_ERROR",
      status: 500
    });
  }
}
