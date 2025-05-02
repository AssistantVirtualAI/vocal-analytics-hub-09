
import { ErrorCode } from "./types.ts";
import { createErrorResponse } from "./utils.ts";

/**
 * Fetch data from ElevenLabs API for a specific call
 * @param callId - ID of the call to fetch
 * @param apiKey - ElevenLabs API key
 * @returns Object containing audio URL, transcript, summary, and statistics
 */
export async function fetchElevenLabsData(callId: string, apiKey: string) {
  console.log(`Fetching data from ElevenLabs API for call ${callId}`);
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/calls/${callId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "xi-api-key": apiKey,
      },
    });

    // Handle non-successful responses
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        /* Ignore JSON parsing error if body is empty or not JSON */
      }

      const errorMessage = errorData.detail?.message || 
                          errorData.detail || 
                          `ElevenLabs API returned status ${response.status}`;
      
      console.error("ElevenLabs API error:", response.status, errorMessage, errorData);

      // Handle specific error cases
      switch (response.status) {
        case 401:
          throw createErrorResponse(
            "Authentication failed with ElevenLabs API. Check API Key.",
            401,
            ErrorCode.ELEVENLABS_AUTH_ERROR
          );
        case 404:
          throw createErrorResponse(
            `Call ID ${callId} not found on ElevenLabs.`,
            404,
            ErrorCode.ELEVENLABS_NOT_FOUND
          );
        case 429:
          throw createErrorResponse(
            "ElevenLabs API rate limit or quota exceeded.",
            429,
            ErrorCode.ELEVENLABS_QUOTA_EXCEEDED
          );
        default:
          throw createErrorResponse(
            errorMessage,
            response.status,
            ErrorCode.ELEVENLABS_API_ERROR
          );
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Response) {
      // Already formatted as error response
      throw error;
    }
    // Handle network errors
    throw createErrorResponse(
      `Network error fetching from ElevenLabs: ${error.message}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}

/**
 * Fetch statistics data separately if not included in main call data
 * @param callId - ID of the call
 * @param apiKey - ElevenLabs API key
 * @returns Statistics object or null if unavailable
 */
export async function fetchElevenLabsStatistics(callId: string, apiKey: string) {
  console.log(`Attempting to fetch statistics separately for call ${callId}`);
  
  try {
    const statsResponse = await fetch(
      `https://api.elevenlabs.io/v1/calls/${callId}/statistics`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "xi-api-key": apiKey,
        },
      }
    );

    if (statsResponse.ok) {
      const statistics = await statsResponse.json();
      console.log("Fetched statistics separately:", JSON.stringify(statistics));
      return statistics;
    } else {
      console.warn(`Failed to fetch statistics separately: ${statsResponse.status}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching statistics separately:", error);
    return null;
  }
}
