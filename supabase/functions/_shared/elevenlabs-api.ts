
// Shared module for interacting with the ElevenLabs API
import { fetchWithRetry } from "./fetch-with-retry.ts";

const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";

// Define ErrorCode enum here instead of importing it
enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  MISSING_ENV_VAR = "MISSING_ENV_VAR",
  DB_ERROR = "DB_ERROR",
  NOT_FOUND = "NOT_FOUND",
  ELEVENLABS_API_ERROR = "ELEVENLABS_API_ERROR",
  ELEVENLABS_AUTH_ERROR = "ELEVENLABS_AUTH_ERROR",
  ELEVENLABS_NOT_FOUND = "ELEVENLABS_NOT_FOUND",
  ELEVENLABS_QUOTA_EXCEEDED = "ELEVENLABS_QUOTA_EXCEEDED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

// Utility function for creating error responses
export function createErrorResponse(message: string, status: number = 500, code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR) {
  console.error(`Error: ${code} - ${message}`);
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Fetch conversations from the ElevenLabs Conversational AI API
 * with support for filtering by agent, date range, and pagination
 * 
 * @param apiKey - ElevenLabs API key
 * @param options - Optional parameters for filtering
 * @returns List of conversations and cursor for pagination
 */
export async function fetchElevenLabsConversations(apiKey: string, options: {
  agentId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  cursor?: string;
} = {}) {
  console.log("Fetching conversations from ElevenLabs API with filters:", options);
  
  try {
    const params = new URLSearchParams();
    
    if (options.agentId) {
      params.append('agent_id', options.agentId);
    }
    
    if (options.fromDate) {
      params.append('call_start_after_unix', Math.floor(options.fromDate.getTime() / 1000).toString());
    }
    
    if (options.toDate) {
      params.append('call_start_before_unix', Math.floor(options.toDate.getTime() / 1000).toString());
    }
    
    params.append('limit', options.limit?.toString() || '100');
    
    if (options.cursor) {
      params.append('cursor', options.cursor);
    }
    
    const url = `${ELEVENLABS_API_BASE_URL}/convai/conversations${params.size > 0 ? `?${params.toString()}` : ''}`;
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
        console.error("Failed to parse error response from /convai/conversations", parseError);
      }
      handleElevenLabsApiError(errorStatus, errorMessage, "Error fetching conversations");
    }

    const conversationsData = await response.json();
    console.log(`Retrieved ${conversationsData.conversations?.length || 0} conversations from ElevenLabs`);
    console.log(`Pagination cursor: ${conversationsData.cursor || 'none'}`);
    
    return conversationsData;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching from ElevenLabs (/convai/conversations): ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}

/**
 * Fetch all conversations with pagination handling
 * This function will continue fetching until all pages are retrieved
 * 
 * @param apiKey - ElevenLabs API key
 * @param options - Optional parameters for filtering
 * @returns All conversations matching the criteria
 */
export async function fetchAllElevenLabsConversations(apiKey: string, options: {
  agentId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  maxPages?: number;
} = {}) {
  console.log("Fetching all conversations with pagination from ElevenLabs API");
  
  let allConversations = [];
  let cursor: string | null | undefined = null;
  let hasMore = true;
  let pageCount = 0;
  const maxPages = options.maxPages || 10;
  const effectiveLimit = options.limit || 100;
  
  while (hasMore && pageCount < maxPages) {
    pageCount++;
    console.log(`Fetching page ${pageCount} of conversations with cursor: ${cursor || 'initial'}`);
    
    try {
      const result = await fetchElevenLabsConversations(apiKey, {
        ...options,
        limit: effectiveLimit,
        cursor: cursor || undefined,
      });
      
      if (result.conversations && Array.isArray(result.conversations)) {
        allConversations = [...allConversations, ...result.conversations];
        console.log(`Added ${result.conversations.length} conversations, total: ${allConversations.length}`);
      }
      
      cursor = result.cursor;
      hasMore = !!cursor;
      
      if (!hasMore) {
        console.log("No more conversation pages to fetch.");
      }
    } catch (error) {
      console.error(`Failed to fetch conversation page ${pageCount}. Error: ${error.message || error}`);
      break;
    }
  }
  
  if (pageCount >= maxPages && hasMore) {
    console.warn(`Reached maximum number of pages (${maxPages}) for conversations, some might be missing`);
  }
  
  return allConversations;
}

/**
 * Fetch dashboard settings from ElevenLabs API
 * This endpoint provides information about available agents and their settings
 * 
 * @param apiKey - ElevenLabs API key
 * @returns Dashboard settings data
 */
export async function fetchElevenLabsDashboardSettings(apiKey: string) {
  console.log("Fetching ElevenLabs dashboard settings");
  
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
        console.error("Failed to parse error response from dashboard-settings", parseError);
      }
      handleElevenLabsApiError(errorStatus, errorMessage, "Error fetching dashboard settings");
    }

    const dashboardSettings = await response.json();
    console.log("Successfully retrieved dashboard settings");
    
    // Extract list of agent IDs for easier access
    const agentIds = dashboardSettings.agents?.map((agent: any) => agent.agent_id) || [];
    console.log(`Available agents: ${agentIds.join(', ')}`);
    
    return {
      ...dashboardSettings,
      agentIds
    };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching dashboard settings from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching dashboard settings from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}

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

/**
 * Get audio URL for a conversation
 * @param conversationId - ID of the conversation
 * @param messageId - Optional ID of the specific message
 * @returns Audio URL string
 */
export function getElevenLabsConversationAudioUrl(conversationId: string, messageId?: string) {
  if (messageId) {
    return `${ELEVENLABS_API_BASE_URL}/convai/conversations/${conversationId}/messages/${messageId}/audio`;
  }
  return `${ELEVENLABS_API_BASE_URL}/convai/conversations/${conversationId}/audio`;
}

/**
 * Fetch conversation transcript
 * @param conversationId - ID of the conversation
 * @param apiKey - ElevenLabs API key
 * @returns Transcript data
 */
export function fetchElevenLabsConversationTranscript(conversationId: string, apiKey: string) {
  console.log(`Fetching transcript for conversation ID ${conversationId}`);
  
  return fetchWithRetry(`${ELEVENLABS_API_BASE_URL}/convai/conversations/${conversationId}/transcript`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "xi-api-key": apiKey,
    }
  }, 3)
  .then(async response => {
    if (!response.ok) {
      const status = response.status;
      let errorMessage = `Error fetching transcript for conversation ${conversationId}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) { console.error("Failed to parse error JSON for transcript", e); }
      handleElevenLabsApiError(status, errorMessage, errorMessage);
    }
    return response.json();
  })
  .then(data => {
    console.log(`Successfully retrieved transcript for conversation ${conversationId}`);
    return data;
  })
  .catch(error => {
    if (error instanceof Response) throw error;
    console.error(`Network error fetching transcript from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching transcript from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  });
}

/**
 * Helper function to handle errors from the ElevenLabs API
 */
function handleElevenLabsApiError(status: number, errorMessage: string, baseErrorMessage: string) {
  console.error("ElevenLabs API error:", status, errorMessage);
  let errCode = ErrorCode.ELEVENLABS_API_ERROR;
  let msg = `${baseErrorMessage}: ${errorMessage}`;

  switch (status) {
    case 401:
      errCode = ErrorCode.ELEVENLABS_AUTH_ERROR;
      msg = "Authentication failed with ElevenLabs API. Check API Key.";
      break;
    case 404:
      errCode = ErrorCode.ELEVENLABS_NOT_FOUND;
      msg = `Item not found on ElevenLabs.`;
      break;
    case 429:
      errCode = ErrorCode.ELEVENLABS_QUOTA_EXCEEDED;
      msg = "ElevenLabs API rate limit or quota exceeded.";
      break;
  }
  // Throw a Response object directly, as expected by some callers
  throw createErrorResponse(msg, status, errCode);
}
