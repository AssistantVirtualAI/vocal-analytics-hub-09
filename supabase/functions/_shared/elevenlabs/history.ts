
// Shared module for interacting with the ElevenLabs API - History functionality
import { fetchWithRetry } from "../fetch-with-retry.ts";
import { ELEVENLABS_API_BASE_URL, handleElevenLabsApiError } from "./client.ts";
import { 
  HistoryItem, 
  HistoryFetchResult, 
  HistoryFetchOptions 
} from "./history-types.ts";
import { createHistoryError } from "./history-error.ts";
import { fetchHistoryBatch, filterHistoryByVoiceId } from "./history-fetch.ts";

/**
 * Fetch history items from ElevenLabs API
 * @param apiKey ElevenLabs API key
 * @param voiceId Optional voice ID filter
 * @param pageSize Number of items per request
 * @param maxItems Maximum items to return in total (across multiple requests)
 * @returns Array of history items or error
 */
export async function fetchElevenLabsHistory(
  apiKey?: string,
  voiceId?: string,
  pageSize = 100,
  maxItems = 1000
): Promise<HistoryFetchResult> {
  try {
    // Double-check API key value
    if (!apiKey) {
      console.error("Missing ElevenLabs API key");
      return createHistoryError("Missing ElevenLabs API key. Please configure ELEVENLABS_API_KEY in your environment.");
    }
    
    // Log a masked version of the API key for debugging
    const maskedKey = apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}` : 'undefined';
    console.log(`Fetching ElevenLabs history with API key: ${maskedKey}, Voice ID: ${voiceId || 'all'}, Page Size: ${pageSize}`);

    // URL for the history API
    let url = `${ELEVENLABS_API_BASE_URL}/history?page_size=${pageSize}`;
    
    // Add voice filter if provided - CRITICAL for filtering by the correct voice/agent
    if (voiceId) {
      url += `&voice_id=${encodeURIComponent(voiceId)}`;
      console.log(`Filtering ElevenLabs history by voice_id: ${voiceId}`);
    }

    console.log(`Calling ElevenLabs History API: ${url}`);
    
    const allItems: HistoryItem[] = [];
    let hasMore = true;
    let lastItemId: string | undefined = undefined;
    let totalRequests = 0;
    
    // Loop to fetch all pages
    while (hasMore && allItems.length < maxItems && totalRequests < 10) {
      totalRequests++;
      
      // Add pagination token if we have one
      const paginationUrl = lastItemId ? `${url}&history_item_id=${lastItemId}` : url;
      
      const batchResult = await fetchHistoryBatch(apiKey, paginationUrl);
      
      if (!batchResult.success) {
        return batchResult;
      }
      
      // Filter by voice_id if needed
      const filteredItems = filterHistoryByVoiceId(batchResult.data.items, voiceId);
      
      // Add items to our collection
      allItems.push(...filteredItems);
      
      // Update pagination state
      hasMore = batchResult.data.hasMore;
      lastItemId = batchResult.data.lastItemId;
      
      console.log(`Retrieved ${filteredItems.length} items, total: ${allItems.length}, has_more: ${hasMore}`);
      
      // Respect API rate limits
      if (hasMore && allItems.length < maxItems) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Completed fetching history, total items: ${allItems.length}`);
    return { success: true, data: allItems };
  } catch (error) {
    console.error(`Error fetching ElevenLabs history:`, error);
    return createHistoryError(`Error fetching ElevenLabs history: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch a specific history item from ElevenLabs
 */
export async function fetchElevenLabsHistoryItem(historyItemId: string, apiKey: string): Promise<HistoryItem> {
  if (!apiKey) {
    throw new Error("Missing ElevenLabs API key");
  }
  
  try {
    const url = `${ELEVENLABS_API_BASE_URL}/history/${historyItemId}`;
    
    const response = await fetchWithRetry(url, {
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      handleElevenLabsApiError(
        response.status,
        response.statusText,
        `Could not fetch history item ${historyItemId}`
      );
    }
    
    const historyItem = await response.json();
    return historyItem;
  } catch (error) {
    console.error(`Error fetching history item ${historyItemId}:`, error);
    throw error;
  }
}
