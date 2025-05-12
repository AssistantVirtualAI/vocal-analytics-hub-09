
import { SyncResult } from "./models.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Create a success response with results and summary
 */
export function createSuccessResponse(results: SyncResult[], summary: { total: number, success: number, error: number }) {
  return new Response(
    JSON.stringify({
      success: true,
      results,
      summary
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create a response for when no results are found
 */
export function createEmptyResultResponse() {
  return new Response(
    JSON.stringify({
      success: true,
      results: [],
      summary: {
        total: 0,
        success: 0,
        error: 0
      },
      message: "No history items found to sync"
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create a special error response for ElevenLabs API errors
 */
export function createElevenLabsErrorResponse(errorMsg: string) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: errorMsg,
        code: "ELEVENLABS_FETCH_ERROR"
      }
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create a generic error response for unexpected errors
 */
export function createGenericErrorResponse(error: unknown) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        code: "INTERNAL_SERVER_ERROR"
      }
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
