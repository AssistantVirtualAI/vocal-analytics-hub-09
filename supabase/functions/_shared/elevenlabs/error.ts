
// Error handling utilities for ElevenLabs API integration

// Define ErrorCode enum
export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  MISSING_ENV_VAR = "MISSING_ENV_VAR",
  DB_ERROR = "DB_ERROR",
  NOT_FOUND = "NOT_FOUND",
  ELEVENLABS_API_ERROR = "ELEVENLABS_API_ERROR",
  ELEVENLABS_AUTH_ERROR = "ELEVENLABS_AUTH_ERROR",
  ELEVENLABS_NOT_FOUND = "ELEVENLABS_NOT_FOUND",
  ELEVENLABS_QUOTA_EXCEEDED = "ELEVENLABS_QUOTA_EXCEEDED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

// Utility function for creating error responses
export function createErrorResponse(message: string, status: number = 500, code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR) {
  console.error(`Error: ${code} - ${message}`);
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
