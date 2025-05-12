
import { ELEVENLABS_API_BASE_URL } from "./client.ts";
import { HistoryItem } from "./history-types.ts";
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
) {
  try {
    // Double-check API key value
    if (!apiKey) {
      console.error("Missing ElevenLabs API key");
      return { 
        success: false, 
        error: "Missing ElevenLabs API key. Please configure ELEVENLABS_API_KEY in your environment."
      };
    }
    
    // Log a masked version of the API key for debugging
    const maskedKey = apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}` : 'undefined';
    console.log(`Fetching ElevenLabs history with API key: ${maskedKey}, Voice ID: ${voiceId || 'all'}, Page Size: ${pageSize}`);

    // URL for the history API
    let url = `${ELEVENLABS_API_BASE_URL}/history?page_size=${pageSize}`;
    
    // Add voice filter if provided
    if (voiceId) {
      url += `&voice_id=${encodeURIComponent(voiceId)}`;
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
      const paginationUrl = lastItemId ? 
        `${url}&history_item_id=${encodeURIComponent(lastItemId)}` : url;
      
      const result = await fetchHistoryBatch(apiKey, paginationUrl);
      
      if (!result.success) {
        return result;
      }
      
      // Add items to our collection
      allItems.push(...result.data.items);
      
      // Check if there are more pages
      hasMore = result.data.hasMore;
      lastItemId = result.data.lastItemId;
      
      console.log(`Retrieved ${result.data.items.length} items, total: ${allItems.length}, has_more: ${hasMore}`);
      
      // Respect API rate limits
      if (hasMore && allItems.length < maxItems) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Completed fetching history, total items: ${allItems.length}`);
    return {
      success: true, 
      data: filterHistoryByVoiceId(allItems, voiceId)
    };
  } catch (error) {
    console.error(`Error fetching ElevenLabs history:`, error);
    return {
      success: false,
      error: `Error fetching ElevenLabs history: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Fetch a specific history item from ElevenLabs
 */
export async function fetchElevenLabsHistoryItem(historyItemId: string, apiKey: string): Promise<HistoryItem> {
  if (!apiKey) {
    throw new Error("Missing ElevenLabs API key");
  }
  
  const url = `${ELEVENLABS_API_BASE_URL}/history/${encodeURIComponent(historyItemId)}`;
  
  const response = await fetchWithRetry(url, {
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorStatus = response.status;
    let errorMessage = `ElevenLabs API returned status ${errorStatus}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail?.message || errorData.detail || errorMessage;
    } catch (parseError) {
      console.error(`Failed to parse error response`, parseError);
    }
    
    throw new Error(`Could not fetch history item ${historyItemId}: ${errorMessage}`);
  }
  
  return await response.json();
}

// Import here to avoid circular dependency
import { fetchWithRetry } from "../fetch-with-retry.ts";
