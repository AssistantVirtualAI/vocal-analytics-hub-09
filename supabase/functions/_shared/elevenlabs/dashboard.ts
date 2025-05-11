
// ElevenLabs API dashboard-related operations
import { fetchWithRetry } from "../fetch-with-retry.ts";
import { ELEVENLABS_API_BASE_URL, handleElevenLabsApiError } from "./client.ts";
import { createErrorResponse, ErrorCode } from "./error.ts";

/**
 * Fetch dashboard settings from ElevenLabs API
 * This provides information about available agents and other settings
 * 
 * @param apiKey - ElevenLabs API key
 * @returns Dashboard settings data
 */
export async function fetchElevenLabsDashboardSettings(apiKey: string) {
  console.log("Fetching dashboard settings from ElevenLabs API");
  
  try {
    const url = `${ELEVENLABS_API_BASE_URL}/convai/dashboard-settings`;
    console.log(`Calling ElevenLabs API: ${url}`);
    
    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      }
    }, 3);

    if (!response.ok) {
      const errorStatus = response.status;
      let errorMessage = `ElevenLabs API returned status ${errorStatus}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail?.message || errorData.detail || errorMessage;
      } catch (parseError) {
        console.error("Failed to parse error response from /convai/dashboard-settings", parseError);
      }
      handleElevenLabsApiError(errorStatus, errorMessage, "Error fetching dashboard settings");
    }

    const settingsData = await response.json();
    console.log("Successfully retrieved dashboard settings from ElevenLabs");
    
    return settingsData;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching from ElevenLabs (/convai/dashboard-settings): ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}
