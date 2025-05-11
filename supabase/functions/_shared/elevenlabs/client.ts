
// Shared module for interacting with the ElevenLabs API - Core client functionality
import { fetchWithRetry } from "../fetch-with-retry.ts";
import { createErrorResponse, ErrorCode } from "./error.ts";

export const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * Helper function to handle errors from the ElevenLabs API
 */
export function handleElevenLabsApiError(status: number, errorMessage: string, baseErrorMessage: string) {
  console.error("ElevenLabs API error:", status, errorMessage);
  let errCode = ErrorCode.ELEVENLABS_API_ERROR;
  let msg = `${baseErrorMessage}: ${errorMessage}`;

  switch (status) {
    case 401:
      errCode = ErrorCode.ELEVENLABS_AUTH_ERROR;
      msg = "Authentication failed with ElevenLabs API. Check API Key.";
      break;
    case 404:
      errCode = ErrorCode.ELEVENLABS_NOT_FOUND;
      msg = `Item not found on ElevenLabs.`;
      break;
    case 429:
      errCode = ErrorCode.ELEVENLABS_QUOTA_EXCEEDED;
      msg = "ElevenLabs API rate limit or quota exceeded.";
      break;
  }
  // Throw a Response object directly, as expected by some callers
  throw createErrorResponse(msg, status, errCode);
}
