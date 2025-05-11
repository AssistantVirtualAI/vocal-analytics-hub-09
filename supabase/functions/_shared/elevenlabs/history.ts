
// Shared module for interacting with the ElevenLabs API - History functionality
import { fetchWithRetry } from "../fetch-with-retry.ts";
import { ELEVENLABS_API_BASE_URL, handleElevenLabsApiError } from "./client.ts";

export interface HistoryItem {
  history_item_id: string;
  voice_id?: string;
  model_id?: string;
  text?: string;
  created_at?: string;
  date_unix?: number;
  [key: string]: any;
}

export interface ElevenLabsHistoryResponse {
  history: HistoryItem[];
  last_history_item_id?: string;
  has_more?: boolean;
}

/**
 * Fetch history items from ElevenLabs API
 * @param apiKey ElevenLabs API key
 * @param voiceId Optional voice ID filter
 * @param pageSize Number of items per request
 * @param maxItems Maximum items to return in total (across multiple requests)
 * @returns Array of history items
 */
export async function fetchElevenLabsHistory(
  apiKey: string,
  voiceId?: string,
  pageSize = 100,
  maxItems = 1000
): Promise<HistoryItem[]> {
  try {
    console.log(`Fetching ElevenLabs history. Voice ID filter: ${voiceId}, Page Size: ${pageSize}, Max Items: ${maxItems}`);

    // URL for the history API
    let url = `${ELEVENLABS_API_BASE_URL}/history?page_size=${pageSize}`;
    
    // Add voice filter if provided
    if (voiceId) {
      url += `&voice_id=${voiceId}`;
    }

    console.log(`Calling ElevenLabs History API: ${url}`);
    
    const allItems: HistoryItem[] = [];
    let hasMore = true;
    let lastItemId: string | undefined = undefined;
    let totalRequests = 0;
    
    try {
      // Loop to fetch all pages
      while (hasMore && allItems.length < maxItems && totalRequests < 10) {
        totalRequests++;
        
        // Add pagination token if we have one
        const paginationUrl = lastItemId ? `${url}&history_item_id=${lastItemId}` : url;
        
        const response = await fetchWithRetry(paginationUrl, {
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
        });
        
        console.log(`Response status: ${response.status}, URL: ${paginationUrl}`);
        
        if (!response.ok) {
          // Attempt to extract error details
          try {
            const errorText = await response.text();
            console.error(`Error response (${response.status}): ${response.statusText}`);
            console.error(`Error response text: ${errorText}`);
            throw new Error(`Error fetching history items from ElevenLabs`);
          } catch (textError) {
            console.error(`Failed to parse error response from /history`, textError);
            throw new Error(`Error fetching history items from ElevenLabs`);
          }
        }
        
        let data: ElevenLabsHistoryResponse;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error(`Error during fetchElevenLabsHistory JSON parsing:`, jsonError);
          throw new Error(`Error parsing response from ElevenLabs API`);
        }
        
        if (!data.history || !Array.isArray(data.history)) {
          console.error(`Invalid response format from ElevenLabs API:`, data);
          throw new Error(`Invalid response format from ElevenLabs API`);
        }
        
        // Add items to our collection
        allItems.push(...data.history);
        
        // Check if there are more pages
        hasMore = !!data.has_more;
        lastItemId = data.last_history_item_id;
        
        console.log(`Retrieved ${data.history.length} items, total: ${allItems.length}, has_more: ${hasMore}`);
        
        // Respect API rate limits
        if (hasMore && allItems.length < maxItems) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`Completed fetching history, total items: ${allItems.length}`);
      return allItems;
      
    } catch (loopError) {
      console.error(`Error during fetchElevenLabsHistory loop:`, loopError);
      throw loopError;
    }
  } catch (error) {
    console.error(`Error fetching ElevenLabs history:`, error);
    throw error;
  }
}

/**
 * Fetch a specific history item from ElevenLabs
 */
export async function fetchElevenLabsHistoryItem(historyItemId: string, apiKey: string): Promise<HistoryItem> {
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
