
import { ErrorCode } from "./types.ts";
import { createErrorResponse } from "./utils.ts";

/**
 * Fetches history item data from ElevenLabs API.
 * This includes metadata and some statistics like character count.
 * The `historyItemId` is the `callId` from the original code's context.
 * @param historyItemId - ID of the history item to fetch (equivalent to callId).
 * @param apiKey - ElevenLabs API key.
 * @returns Object containing the history item data and the URL to fetch the audio.
 */
export async function fetchElevenLabsHistoryData(historyItemId: string, apiKey: string) {
  console.log(`Fetching history item from ElevenLabs API for ID ${historyItemId}`);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/history/${historyItemId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // Ignore JSON parsing error if body is empty or not JSON
      }

      const errorMessage = errorData.detail?.message ||
                          errorData.detail ||
                          `ElevenLabs API returned status ${response.status}`;

      console.error("ElevenLabs API error:", response.status, errorMessage, errorData);

      switch (response.status) {
        case 401:
          throw createErrorResponse(
            "Authentication failed with ElevenLabs API. Check API Key.",
            401,
            ErrorCode.ELEVENLABS_AUTH_ERROR
          );
        case 404:
          throw createErrorResponse(
            `History Item ID ${historyItemId} not found on ElevenLabs. This ID is the 'callId' or 'history_item_id'.`,
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

    const historyData = await response.json();
    
    // Construct the direct URL to fetch the audio for this history item
    const audioUrl = `https://api.elevenlabs.io/v1/history/${historyItemId}/audio`;

    // The historyData object itself contains statistics like character counts (e.g., historyData.character_count_change_to)
    // and the input text (historyData.text), which can be considered the transcript of the input.
    // "Summary" is not directly provided by this endpoint and would need to be generated elsewhere if required.
    return {
        ...historyData, // Includes all history item fields, like 'text', 'date_unix', 'character_count_change_to', etc.
        audio_url: audioUrl, // The direct URL to stream/download the audio recording
        // Statistics are part of historyData. For example, historyData.character_count_change_to
        // Transcript (of input) is historyData.text
    };

  } catch (error) {
    if (error instanceof Response) {
      // Already formatted as error response
      throw error;
    }
    // Handle network errors
    console.error(`Network error fetching from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}

/**
 * Fetches the audio content for a specific history item from ElevenLabs API.
 * This function can be used if the server needs to process or proxy the audio.
 * Otherwise, the `audio_url` from `fetchElevenLabsHistoryData` can be used by the client.
 * @param historyItemId - ID of the history item.
 * @param apiKey - ElevenLabs API key.
 * @returns The raw Response object from the fetch call, which contains the audio stream.
 */
export async function fetchElevenLabsHistoryItemAudio(historyItemId: string, apiKey: string): Promise<Response> {
  console.log(`Fetching audio for history item ID ${historyItemId} from ElevenLabs API`);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/history/${historyItemId}/audio`, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      let errorDetail = `ElevenLabs API returned status ${response.status} for audio.`;
      try {
        const textError = await response.text(); // Try to get text error first
        if (textError) errorDetail = textError;
      } catch {
        // Ignore parsing error if body is not text
      }

      console.error("ElevenLabs API audio error:", response.status, errorDetail);

      switch (response.status) {
        case 401:
          throw createErrorResponse(
            "Authentication failed with ElevenLabs API for audio. Check API Key.",
            401,
            ErrorCode.ELEVENLABS_AUTH_ERROR
          );
        case 404:
          throw createErrorResponse(
            `Audio for History Item ID ${historyItemId} not found on ElevenLabs. This ID is the 'callId' or 'history_item_id'.`,
            404,
            ErrorCode.ELEVENLABS_NOT_FOUND
          );
        default:
          throw createErrorResponse(
            errorDetail,
            response.status,
            ErrorCode.ELEVENLABS_API_ERROR
          );
      }
    }
    // Return the Response object directly. The caller can then use .blob(), .arrayBuffer(), .body (ReadableStream), etc.
    return response;

  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching audio from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching audio from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}

// The previous `fetchElevenLabsStatistics` function is no longer needed as statistics
// (like character counts) are part of the main history item response from `fetchElevenLabsHistoryData`.
// The `statsCalculator.ts` in the `get-stats` function can be adapted to use these fields if necessary.
