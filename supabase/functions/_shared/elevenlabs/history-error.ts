
/**
 * Error handling utilities for ElevenLabs history API
 */

/**
 * Format error messages related to history fetching
 */
export function formatHistoryError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Create an error result for history fetch operations
 */
export function createHistoryError(message: string): {
  success: false;
  error: string;
} {
  return {
    success: false,
    error: message
  };
}

/**
 * Handle API errors from ElevenLabs history endpoints
 */
export function handleHistoryApiError(
  status: number, 
  responseText: string, 
  defaultMessage = "Unknown ElevenLabs API error"
): {success: false, error: string} {
  let errorMessage = defaultMessage;

  if (status === 401) {
    errorMessage = "Invalid ElevenLabs API key. Please check your API key configuration.";
  } else if (status === 429) {
    errorMessage = "ElevenLabs API rate limit exceeded. Please try again later.";
  } else if (responseText) {
    errorMessage = `ElevenLabs API error (${status}): ${responseText}`;
  }

  return createHistoryError(errorMessage);
}
