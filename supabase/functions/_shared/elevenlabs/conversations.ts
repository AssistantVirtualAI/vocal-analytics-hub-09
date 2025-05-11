
// ElevenLabs API conversation endpoints handlers
import { fetchWithRetry } from "../fetch-with-retry.ts";
import { ELEVENLABS_API_BASE_URL, handleElevenLabsApiError } from "./client.ts";
import { createErrorResponse, ErrorCode } from "./error.ts";

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
  let cursor: string | null | undefined = null; // Ensure cursor can be null or undefined
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
        cursor: cursor || undefined, // Pass undefined if cursor is null
      });
      
      if (result.conversations && Array.isArray(result.conversations)) {
        allConversations = [...allConversations, ...result.conversations];
        console.log(`Added ${result.conversations.length} conversations, total: ${allConversations.length}`);
      }
      
      cursor = result.cursor;
      hasMore = !!cursor; // Simpler check for hasMore
      
      if (!hasMore) {
        console.log("No more conversation pages to fetch.");
      }
    } catch (error) {
      console.error(`Failed to fetch conversation page ${pageCount}. Error: ${error.message || error}`);
      // Depending on the error, you might want to break or retry with backoff
      // For simplicity, we break here. Implement retries if needed.
      break; 
    }
  }
  
  if (pageCount >= maxPages && hasMore) {
    console.warn(`Reached maximum number of pages (${maxPages}) for conversations, some might be missing`);
  }
  
  return allConversations;
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
