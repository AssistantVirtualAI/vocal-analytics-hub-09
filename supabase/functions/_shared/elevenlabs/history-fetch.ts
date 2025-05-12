import { fetchWithRetry } from "../fetch-with-retry.ts";
import { HistoryItem, HistoryFetchResult } from "./history-types.ts";
import { createHistoryError, handleHistoryApiError } from "./history-error.ts";

/**
 * Fetch a batch of history items from ElevenLabs API
 */
export async function fetchHistoryBatch(
  apiKey: string, 
  url: string
): Promise<HistoryFetchResult & { data: { items: HistoryItem[], hasMore: boolean, lastItemId?: string } }> {
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
    }, 3, 1000, 10000);
    
    console.log(`Response status: ${response.status}, URL: ${url}`);
    
    if (!response.ok) {
      const statusCode = response.status;
      let errorText = response.statusText || '';
      
      try {
        // Try to extract error details as JSON
        const errorData = await response.clone().json().catch(() => null);
        if (errorData && errorData.detail) {
          console.error(`Error response details:`, errorData);
          errorText = errorData.detail || errorData.message || errorText;
        }
      } catch (jsonError) {
        // If JSON parsing fails, try to get the error as text
        errorText = await response.clone().text().catch(() => errorText);
      }
      
      return handleHistoryApiError(statusCode, errorText);
    }
    
    // Parse response data
    let data: any;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`Error parsing JSON response:`, jsonError);
      return createHistoryError(`Error parsing response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      console.error(`Invalid response (not an object):`, data);
      return createHistoryError("Invalid response format (not an object)");
    }
    
    // Check if history field exists and is an array
    if (!data.history || !Array.isArray(data.history)) {
      console.error(`Invalid response format (missing history array):`, data);
      
      // If we're getting a different structure than expected, let's log what fields we did get
      const availableFields = Object.keys(data).join(', ');
      console.error(`Available fields in response: ${availableFields}`);
      
      // Check if we might be hitting a different endpoint structure
      if (data.results && Array.isArray(data.results)) {
        console.log("Found 'results' array instead of 'history' array, adapting...");
        data.history = data.results; // Adapt to different format
      } else {
        return createHistoryError(`Invalid response format (missing history array). Got fields: ${availableFields}`);
      }
    }
    
    return {
      success: true, 
      data: {
        items: data.history,
        hasMore: !!data.has_more,
        lastItemId: data.last_history_item_id
      }
    };
  } catch (error) {
    console.error(`Error in fetchHistoryBatch:`, error);
    return createHistoryError(`Error fetching history batch: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Filter history items by voice_id if needed
 */
export function filterHistoryByVoiceId(items: HistoryItem[], voiceId?: string): HistoryItem[] {
  if (!voiceId) return items;
  
  return items.filter(item => {
    // Only keep items where voice_id matches or is undefined
    return !item.voice_id || item.voice_id === voiceId;
  });
}
