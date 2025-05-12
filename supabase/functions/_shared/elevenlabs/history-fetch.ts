
/**
 * Core functions for fetching ElevenLabs history
 */
import { fetchWithRetry } from "../fetch-with-retry.ts";
import { ELEVENLABS_API_BASE_URL } from "./client.ts";
import { HistoryItem, HistoryFetchResult, HistoryFetchOptions } from "./history-types.ts";
import { createHistoryError, handleHistoryApiError } from "./history-error.ts";

/**
 * Fetches a batch of history items from the ElevenLabs API
 * @param apiKey ElevenLabs API key
 * @param url API URL with pagination parameters
 * @param retryCount Current retry count
 * @param maxRetries Maximum number of retries
 * @returns Result containing success status and data or error
 */
export async function fetchHistoryBatch(
  apiKey: string,
  url: string,
  retryCount = 0,
  maxRetries = 3
): Promise<HistoryFetchResult> {
  try {
    console.log(`API Request attempt ${retryCount + 1}/${maxRetries + 1} to: ${url}`);
    
    const response = await fetchWithRetry(url, {
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 15000, // 15 second timeout
    });
    
    console.log(`Response status: ${response.status}, URL: ${url}`);
    
    if (!response.ok) {
      if (response.status === 429 && retryCount < maxRetries) {
        // Rate limiting - wait longer before retrying
        const waitTime = Math.min(1000 * Math.pow(2, retryCount + 1), 10000);
        console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchHistoryBatch(apiKey, url, retryCount + 1, maxRetries);
      } 
      
      if (response.status === 401) {
        console.error("Authentication failed with ElevenLabs API. Invalid API key.");
        return handleHistoryApiError(response.status, "Invalid API key");
      }
      
      // Try to extract error details
      try {
        const errorData = await response.clone().json().catch(() => null);
        if (errorData && errorData.detail) {
          return handleHistoryApiError(response.status, errorData.detail);
        }
      } catch {
        // If JSON parsing fails, try to get the error as text
        const errorText = await response.clone().text().catch(() => response.statusText);
        return handleHistoryApiError(response.status, errorText);
      }
    }
    
    // Parse response data
    let data: any;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`Error parsing JSON response from ElevenLabs history API:`, jsonError);
      return createHistoryError(`Error parsing response from ElevenLabs API: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      console.error(`Invalid response from ElevenLabs API (not an object):`, data);
      return createHistoryError("Invalid response format from ElevenLabs API (not an object)");
    }
    
    // Check if history field exists and is an array
    if (!data.history || !Array.isArray(data.history)) {
      console.error(`Invalid response format from ElevenLabs API (missing history array):`, data);
      
      // If we're getting a different structure than expected, let's log what fields we did get
      const availableFields = Object.keys(data).join(', ');
      console.error(`Available fields in response: ${availableFields}`);
      
      // Check if we might be hitting a different endpoint structure
      if (data.results && Array.isArray(data.results)) {
        console.log("Found 'results' array instead of 'history' array, adapting...");
        data.history = data.results; // Adapt to different format
      } else {
        return createHistoryError(`Invalid response format from ElevenLabs API (missing history array). Got fields: ${availableFields}`);
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
    console.error(`Error during fetchHistoryBatch:`, error);
    return createHistoryError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Filters history items by voice ID
 * @param items History items to filter
 * @param voiceId Voice ID to filter by
 * @returns Filtered history items
 */
export function filterHistoryByVoiceId(items: HistoryItem[], voiceId?: string): HistoryItem[] {
  if (!voiceId) return items;
  
  console.log(`Filtering returned history to only include items with voice_id: ${voiceId}`);
  const filteredHistory = items.filter((item: HistoryItem) => 
    item.voice_id === voiceId || !item.voice_id // Include items without voice_id as they might be relevant
  );
  
  if (filteredHistory.length < items.length) {
    console.log(`Filtered out ${items.length - filteredHistory.length} items that didn't match voice_id ${voiceId}`);
  }
  
  return filteredHistory;
}
