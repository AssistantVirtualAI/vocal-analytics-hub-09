
import { corsHeaders } from "../_shared/cors.ts";
import type { SyncResult } from "./models.ts";

/**
 * Creates a standard successful response with the sync results
 */
export function createSuccessResponse(
  results: SyncResult[],
  summary: {total: number; success: number; error: number}
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      results,
      summary
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

/**
 * Creates an error response for when ElevenLabs API fails
 */
export function createElevenLabsErrorResponse(error: string): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: { 
        message: error || "Failed to fetch ElevenLabs history",
        code: "ELEVENLABS_FETCH_ERROR" 
      }
    }),
    { 
      status: 502,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

/**
 * Creates a response for when no history items are found
 */
export function createEmptyResultResponse(): Response {
  return new Response(
    JSON.stringify({
      success: true,
      results: [],
      summary: {
        total: 0,
        success: 0,
        error: 0
      }
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

/**
 * Creates a generic error response
 */
export function createGenericErrorResponse(error: unknown): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        code: "INTERNAL_SERVER_ERROR"
      }
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}
