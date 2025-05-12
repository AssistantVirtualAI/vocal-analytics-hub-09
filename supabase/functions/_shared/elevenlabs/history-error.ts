
import { HistoryFetchResult } from "./history-types.ts";

/**
 * Create a standardized error response for history operations
 */
export function createHistoryError(message: string): HistoryFetchResult {
  console.error(message);
  return {
    success: false,
    error: message
  };
}

/**
 * Handle standard API errors from the ElevenLabs history API
 */
export function handleHistoryApiError(statusCode: number, errorText: string): HistoryFetchResult {
  let errorMessage = `ElevenLabs API error (${statusCode}): ${errorText || 'Unknown error'}`;
  
  if (statusCode === 401) {
    errorMessage = "Invalid ElevenLabs API key. Please check your API key configuration.";
  }
  
  return createHistoryError(errorMessage);
}
