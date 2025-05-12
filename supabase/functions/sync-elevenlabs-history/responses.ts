
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Create a success response with CORS headers
 */
export function createSuccessResponse(results: any[], summary: any): Response {
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
 * Create an error response for ElevenLabs API issues
 */
export function createElevenLabsErrorResponse(errorDetails: any): Response {
  let errorMessage = "Error accessing ElevenLabs API";
  let errorCode = "ELEVENLABS_FETCH_ERROR";
  
  // Extract more specific error details if available
  if (typeof errorDetails === 'string') {
    errorMessage = errorDetails;
  } else if (errorDetails && errorDetails.message) {
    errorMessage = errorDetails.message;
  }
  
  // Check for specific error cases to provide better error messages
  if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
    errorMessage = "Invalid ElevenLabs API key. Please check your configuration.";
  } else if (errorMessage.includes("missing api key") || errorMessage.includes("no api key")) {
    errorMessage = "Missing ElevenLabs API key. Please configure the variable ELEVENLABS_API_KEY.";
  }
  
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: errorMessage,
        code: errorCode
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

/**
 * Create a response for when no new history items are found
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
 * Create a generic error response with CORS headers
 */
export function createGenericErrorResponse(error: any): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: `An error occurred: ${errorMessage}`,
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
