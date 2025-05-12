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
 * @returns Array of history items or error
 */
export async function fetchElevenLabsHistory(
  apiKey?: string,
  voiceId?: string,
  pageSize = 100,
  maxItems = 1000
): Promise<{success: boolean; data?: HistoryItem[]; error?: string}> {
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
    let retryCount = 0;
    const maxRetries = 3;
    
    try {
      // Loop to fetch all pages
      while (hasMore && allItems.length < maxItems && totalRequests < 10) {
        totalRequests++;
        
        // Add pagination token if we have one
        const paginationUrl = lastItemId ? `${url}&history_item_id=${lastItemId}` : url;
        
        let response;
        let retrySuccess = false;
        
        // Add retry loop for API request
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(`API Request attempt ${attempt + 1}/${maxRetries + 1} to: ${paginationUrl}`);
            
            response = await fetchWithRetry(paginationUrl, {
              headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
              },
              timeout: 15000, // 15 second timeout
            });
            
            console.log(`Response status: ${response.status}, URL: ${paginationUrl}`);
            
            if (response.ok) {
              retrySuccess = true;
              break;
            } else if (response.status === 429) {
              // Rate limiting - wait longer before retrying
              const waitTime = Math.min(1000 * Math.pow(2, attempt + 1), 10000);
              console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else if (response.status === 401) {
              console.error("Authentication failed with ElevenLabs API. Invalid API key.");
              break; // Don't retry auth errors
            } else {
              // Other error, try again with back-off
              const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
              console.log(`Request failed with status ${response.status}, waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          } catch (fetchError) {
            console.error(`Fetch error on attempt ${attempt + 1}:`, fetchError);
            if (attempt < maxRetries) {
              const waitTime = 1000 * Math.pow(2, attempt);
              console.log(`Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        // If all attempts failed, throw an error
        if (!retrySuccess || !response) {
          throw new Error(`Failed to fetch data from ElevenLabs API after ${maxRetries + 1} attempts`);
        }
        
        // Handle API errors with more detailed logging
        if (!response.ok) {
          const statusCode = response.status;
          const statusText = response.statusText || '';
          
          try {
            // Try to extract error details as JSON first
            const errorData = await response.clone().json().catch(() => null);
            if (errorData && errorData.detail) {
              console.error(`Error response details:`, errorData);
              
              if (statusCode === 401) {
                return { 
                  success: false, 
                  error: "Invalid ElevenLabs API key. Please check your API key configuration."
                };
              } else {
                return {
                  success: false,
                  error: `ElevenLabs API error (${statusCode}): ${errorData.detail || errorData.message || 'Unknown error'}`
                };
              }
            }
          } catch (jsonError) {
            // If JSON parsing fails, try to get the error as text
            const errorText = await response.clone().text().catch(() => statusText);
            console.error(`Error response text: ${errorText}`);
            
            return {
              success: false,
              error: `ElevenLabs API error (${statusCode}): ${errorText || statusText}`
            };
          }
        }
        
        // Parse response data
        let data: any;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error(`Error parsing JSON response from ElevenLabs history API:`, jsonError);
          return {
            success: false,
            error: `Error parsing response from ElevenLabs API: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`
          };
        }
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          console.error(`Invalid response from ElevenLabs API (not an object):`, data);
          return {
            success: false,
            error: "Invalid response format from ElevenLabs API (not an object)"
          };
        }
        
        // Check if history field exists and is an array
        if (!data.history || !Array.isArray(data.history)) {
          console.error(`Invalid response format from ElevenLabs API (missing history array):`, data);
          
          // If we're getting a different structure than expected, let's log what fields we did get
          const availableFields = Object.keys(data).join(', ');
          console.error(`Available fields in response: ${availableFields}`);
          
          // Check if we might be hitting a different endpoint structure
          if (data.results && Array.isArray(data.results)) {
            console.log("Found 'results' array instead of 'history' array, trying to adapt...");
            data.history = data.results; // Adapt to different format
          } else {
            return {
              success: false,
              error: `Invalid response format from ElevenLabs API (missing history array). Got fields: ${availableFields}`
            };
          }
        }
        
        // If voice_id filter was provided, double-check the results contain only that voice_id
        if (voiceId && data.history && data.history.length > 0) {
          console.log(`Filtering returned history to only include items with voice_id: ${voiceId}`);
          const filteredHistory = data.history.filter((item: any) => 
            item.voice_id === voiceId || !item.voice_id // Include items without voice_id as they might be relevant
          );
          
          if (filteredHistory.length < data.history.length) {
            console.log(`Filtered out ${data.history.length - filteredHistory.length} items that didn't match voice_id ${voiceId}`);
            data.history = filteredHistory;
          }
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
      return {success: true, data: allItems};
      
    } catch (loopError) {
      console.error(`Error during fetchElevenLabsHistory loop:`, loopError);
      return {
        success: false,
        error: `Error fetching history items: ${loopError instanceof Error ? loopError.message : String(loopError)}`
      };
    }
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
