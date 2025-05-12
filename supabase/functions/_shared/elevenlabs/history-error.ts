
/**
 * Helper functions for handling ElevenLabs history API errors
 */

import { HistoryFetchResult } from "./history-types.ts";

/**
 * Create a standardized error response for history fetch operations
 */
export function createHistoryError(message: string): HistoryFetchResult {
  console.error(`ElevenLabs history error: ${message}`);
  return {
    success: false,
    error: message
  };
}

/**
 * Handle API errors based on status code and error text
 */
export function handleHistoryApiError(statusCode: number, errorText: string): HistoryFetchResult {
  let errorMessage = `ElevenLabs API returned status ${statusCode}`;
  
  // Add more context based on status code
  switch (statusCode) {
    case 401:
      errorMessage = "Invalid ElevenLabs API key. Please check your credentials.";
      break;
    case 403:
      errorMessage = "Access denied. Your ElevenLabs API key may not have sufficient permissions.";
      break;
    case 404:
      errorMessage = "Resource not found. The voice or history item may not exist.";
      break;
    case 429:
      errorMessage = "ElevenLabs rate limit exceeded. Please try again later.";
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorMessage = "ElevenLabs server error. Please try again later.";
      break;
  }
  
  // If we have specific error text, append it
  if (errorText) {
    errorMessage += `: ${errorText}`;
  }
  
  return createHistoryError(errorMessage);
}
