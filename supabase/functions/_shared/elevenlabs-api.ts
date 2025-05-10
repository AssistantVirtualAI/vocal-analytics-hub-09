
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
 * @param apiKey - ElevenLabs API key
 * @returns List of conversations
 */
export async function fetchElevenLabsConversations(apiKey: string) {
  console.log("Fetching conversations from ElevenLabs API");
  
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE_URL}/convai/conversations`, {
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
      handleElevenLabsApiError(response, "Error fetching history items");
    }

    const historyData = await response.json();
    
    // Filter by agent ID if provided
    let filteredItems = historyData.history;
    if (agentId) {
      filteredItems = historyData.history.filter((item: any) => 
        item.voice_id === agentId || 
        item.model_id === agentId
      );
    }
    
    console.log(`Found ${filteredItems.length} history items${agentId ? ` for agent ID: ${agentId}` : ''}`);
    
    return filteredItems;
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
