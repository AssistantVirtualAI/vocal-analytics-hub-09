
import { createErrorResponse } from "./response.ts";
import { reportApiMetrics } from "./metrics.ts";

/**
 * Helper for handling API errors consistently
 * @param error - The error object
 * @param functionName - The name of the function where the error occurred
 * @param startTime - The start time of the API call for metrics
 */
export async function handleApiError(error: any, functionName: string, startTime: number) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error in ${functionName}: ${errorMessage}`, error);
  
  // Report metrics for the failed API call
  try {
    await reportApiMetrics(functionName, startTime, 500, errorMessage);
  } catch (metricsError) {
    console.error(`Failed to report metrics for failed API call: ${String(metricsError)}`);
  }
  
  // Determine if this is a known error type with a specific status code
  let status = 500;
  let code = "INTERNAL_SERVER_ERROR";
  
  if (error && typeof error === 'object') {
    if ('status' in error && typeof error.status === 'number') {
      status = error.status;
    }
    if ('code' in error && typeof error.code === 'string') {
      code = error.code;
    }
  }
  
  return createErrorResponse({
    message: errorMessage,
    status,
    code
  });
}
