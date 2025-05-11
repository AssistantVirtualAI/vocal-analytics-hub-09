
// ElevenLabs API history endpoints handlers
import { fetchWithRetry } from "../fetch-with-retry.ts";
import { ELEVENLABS_API_BASE_URL, handleElevenLabsApiError } from "./client.ts";
import { createErrorResponse, ErrorCode } from "./error.ts";

/**
 * Fetch history items from ElevenLabs API with pagination.
 * This function is kept for compatibility with existing code, but new code should
 * consider using the conversation endpoints if they fit the use case.
 * The /v1/history endpoint seems to be the one providing detailed generation history.
 */
export async function fetchElevenLabsHistory(apiKey: string, elevenLabsVoiceId?: string, pageSize: number = 100, maxItems: number = 1000) {
  console.log(`Fetching ElevenLabs history. Voice ID filter: ${elevenLabsVoiceId || 'all'}, Page Size: ${pageSize}, Max Items: ${maxItems}`);
  
  let allHistoryItems: any[] = [];
  let lastHistoryItemId: string | null = null;
  let hasMore = true;
  let itemsFetchedInCurrentRequest = 0;

  while (hasMore && allHistoryItems.length < maxItems) {
    const params = new URLSearchParams();
    params.append('page_size', pageSize.toString());
    if (lastHistoryItemId) {
      params.append('start_after_history_item_id', lastHistoryItemId);
    }

    const url = `${ELEVENLABS_API_BASE_URL}/history?${params.toString()}`;
    console.log(`Calling ElevenLabs History API: ${url}`);

    try {
      const response = await fetchWithRetry(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "xi-api-key": apiKey,
        }
      }, 3);

      if (!response.ok) {
        const status = response.status;
        let errorMessage = "Error fetching history items from ElevenLabs";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail?.message || errorData.detail || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response from /history", parseError);
        }
        // Throw the error to be caught by the caller (sync-elevenlabs-history/handlers.ts)
        // This allows the caller to handle API errors more specifically.
        console.error(`ElevenLabs History API Error: ${status} - ${errorMessage}`);
        const error = new Error(errorMessage) as any;
        error.status = status;
        throw error; 
      }

      const data = await response.json();
      const historyPageItems = data.history || [];
      itemsFetchedInCurrentRequest = historyPageItems.length;
      console.log(`Retrieved ${itemsFetchedInCurrentRequest} history items in this page.`);

      if (historyPageItems.length > 0) {
        allHistoryItems = allHistoryItems.concat(historyPageItems);
        lastHistoryItemId = historyPageItems[historyPageItems.length - 1].history_item_id;
      }
      
      hasMore = data.has_more && itemsFetchedInCurrentRequest > 0 && itemsFetchedInCurrentRequest === pageSize;
      if (!hasMore) {
          console.log("No more history pages to fetch or page size condition not met.");
      }

    } catch (error) {
      console.error(`Error during fetchElevenLabsHistory loop: ${error.message || error}`);
      // If an error occurs (network, or API error re-thrown), stop pagination and re-throw.
      throw error; 
    }
  }
  
  console.log(`Total history items fetched before filtering: ${allHistoryItems.length}`);

  // Filter by voice_id or model_id if elevenLabsVoiceId is provided
  let filteredItems = allHistoryItems;
  if (elevenLabsVoiceId) {
    console.log(`Filtering total history items by ElevenLabs Voice ID: ${elevenLabsVoiceId}`);
    filteredItems = allHistoryItems.filter((item: any) => 
      item.voice_id === elevenLabsVoiceId || 
      item.model_id === elevenLabsVoiceId // Some history items might use model_id as identifier
    );
    console.log(`Found ${filteredItems.length} history items for Voice ID: ${elevenLabsVoiceId} after filtering.`);
  }
  
  return filteredItems;
}

/**
 * Fetch details of a specific history item
 * @param historyItemId - ID of the history item
 * @param apiKey - ElevenLabs API key
 * @returns History item data
 */
export function fetchElevenLabsHistoryItem(historyItemId: string, apiKey: string) {
  console.log(`Fetching history item from ElevenLabs API for ID ${historyItemId}`);

  return fetchWithRetry(`${ELEVENLABS_API_BASE_URL}/history/${historyItemId}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "xi-api-key": apiKey,
    }
  }, 3) 
  .then(async response => {
    if (!response.ok) {
      const status = response.status;
      let errorMessage = `Error fetching history item ${historyItemId}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) { console.error("Failed to parse error JSON for history item", e); }
      handleElevenLabsApiError(status, errorMessage, errorMessage);
    }
    return response.json();
  })
  .then(historyData => {
    const audioUrl = `${ELEVENLABS_API_BASE_URL}/history/${historyItemId}/audio`;
    return { ...historyData, audio_url: audioUrl };
  })
  .catch(error => {
    if (error instanceof Response) throw error;
    console.error(`Network error fetching history item from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching history item from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  });
}
