// Shared module for interacting with the ElevenLabs API

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
    
    // Set default limit if not provided
    params.append('limit', options.limit?.toString() || '100');
    
    // Add cursor for pagination if provided
    if (options.cursor) {
      params.append('cursor', options.cursor);
    }
    
    const url = `${ELEVENLABS_API_BASE_URL}/convai/conversations${params.size > 0 ? `?${params.toString()}` : ''}`;
    console.log(`Calling ElevenLabs API: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      }
    });

    if (!response.ok) {
      handleElevenLabsApiError(response, "Error fetching conversations");
    }

    const conversationsData = await response.json();
    console.log(`Retrieved ${conversationsData.conversations?.length || 0} conversations from ElevenLabs`);
    console.log(`Pagination cursor: ${conversationsData.cursor || 'none'}`);
    
    return conversationsData;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching from ElevenLabs: ${error.message || error}`);
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
  maxPages?: number; // Safety parameter to limit the number of API calls
} = {}) {
  console.log("Fetching all conversations with pagination from ElevenLabs API");
  
  let allConversations = [];
  let cursor = null;
  let hasMore = true;
  let pageCount = 0;
  const maxPages = options.maxPages || 10; // Default to 10 pages max to prevent endless loops
  
  while (hasMore && pageCount < maxPages) {
    pageCount++;
    console.log(`Fetching page ${pageCount} with cursor: ${cursor || 'initial'}`);
    
    const result = await fetchElevenLabsConversations(apiKey, {
      ...options,
      cursor
    });
    
    if (result.conversations && Array.isArray(result.conversations)) {
      allConversations = [...allConversations, ...result.conversations];
      console.log(`Added ${result.conversations.length} conversations, total: ${allConversations.length}`);
    }
    
    // Check if there's another page
    cursor = result.cursor;
    hasMore = cursor !== null && cursor !== undefined && cursor !== '';
    
    if (!hasMore) {
      console.log("No more pages to fetch");
    }
  }
  
  if (pageCount >= maxPages && hasMore) {
    console.warn(`Reached maximum number of pages (${maxPages}), some conversations might be missing`);
  }
  
  return allConversations;
}

/**
 * Fetch a specific conversation by its ID
 * @param conversationId - ID of the conversation
 * @param apiKey - ElevenLabs API key
 * @returns Conversation data
 */
export async function fetchElevenLabsConversation(conversationId: string, apiKey: string) {
  console.log(`Fetching conversation with ID ${conversationId} from ElevenLabs API`);
  
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE_URL}/convai/conversations/${conversationId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      }
    });

    if (!response.ok) {
      handleElevenLabsApiError(response, `Error fetching conversation ${conversationId}`);
    }

    const conversationData = await response.json();
    console.log(`Successfully retrieved conversation ${conversationId} from ElevenLabs`);
    
    return conversationData;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching conversation from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching conversation from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}

/**
 * For backward compatibility - Fetch history items from ElevenLabs API
 * This function is kept for compatibility with existing code, but new code should
 * use the conversation endpoints.
 */
export async function fetchElevenLabsHistory(apiKey: string, agentId?: string) {
  console.log(`Fetching history for agent ID: ${agentId || 'all'}`);
  
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE_URL}/history`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      }
    });

    if (!response.ok) {
      console.error(`Error fetching history. Status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      handleElevenLabsApiError(response, "Error fetching history items");
    }

    const historyData = await response.json();
    console.log(`Received history data with ${historyData.history?.length || 0} items`);
    
    // Filter by agent ID if provided
    let filteredItems = historyData.history;
    if (agentId) {
      console.log(`Filtering history items by agent ID: ${agentId}`);
      filteredItems = historyData.history.filter((item: any) => 
        item.voice_id === agentId || 
        item.model_id === agentId
      );
    }
    
    console.log(`Found ${filteredItems.length} history items${agentId ? ` for agent ID: ${agentId}` : ''}`);
    
    return filteredItems;
  } catch (error) {
    console.error(`Error in fetchElevenLabsHistory:`, error);
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}

/**
 * Fetch details of a specific history item
 * @param historyItemId - ID of the history item
 * @param apiKey - ElevenLabs API key
 * @returns History item data
 */
export async function fetchElevenLabsHistoryItem(historyItemId: string, apiKey: string) {
  console.log(`Fetching history item from ElevenLabs API for ID ${historyItemId}`);

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE_URL}/history/${historyItemId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      }
    });

    if (!response.ok) {
      handleElevenLabsApiError(response, `Error fetching history item ${historyItemId}`);
    }

    const historyData = await response.json();
    
    // Construct the direct URL to fetch the audio for this history item
    const audioUrl = `${ELEVENLABS_API_BASE_URL}/history/${historyItemId}/audio`;

    return {
        ...historyData,
        audio_url: audioUrl,
    };

  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
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
export async function fetchElevenLabsConversationTranscript(conversationId: string, apiKey: string) {
  console.log(`Fetching transcript for conversation ID ${conversationId}`);
  
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE_URL}/convai/conversations/${conversationId}/transcript`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey,
      }
    });

    if (!response.ok) {
      handleElevenLabsApiError(response, `Error fetching transcript for conversation ${conversationId}`);
    }

    const transcriptData = await response.json();
    console.log(`Successfully retrieved transcript for conversation ${conversationId}`);
    
    return transcriptData;
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`Network error fetching transcript from ElevenLabs: ${error.message || error}`);
    throw createErrorResponse(
      `Network error fetching transcript from ElevenLabs: ${error.message || error}`,
      500,
      ErrorCode.ELEVENLABS_API_ERROR
    );
  }
}

/**
 * Helper function to handle errors from the ElevenLabs API
 */
function handleElevenLabsApiError(response: Response, baseErrorMessage: string) {
  let errorData: any = {};
  try {
    errorData = response.json();
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
        `Item not found on ElevenLabs.`,
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
        `${baseErrorMessage}: ${errorMessage}`,
        response.status,
        ErrorCode.ELEVENLABS_API_ERROR
      );
  }
}
