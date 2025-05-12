
import { fetchWithRetry } from "../fetch-with-retry.ts";

const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";

// Use our hardcoded API key for reliability
const ELEVENLABS_API_KEY = "sk_cb80f1b637b2780c72a39fd600883800050703088fb83dc4";

/**
 * Options for fetching ElevenLabs conversations
 */
interface FetchConversationsOptions {
  agentId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

/**
 * Fetch conversations from ElevenLabs API with pagination support
 */
export async function fetchElevenLabsConversations(
  apiKey = ELEVENLABS_API_KEY,
  options: FetchConversationsOptions = {}
) {
  const { agentId, fromDate, toDate, limit = 100 } = options;
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (agentId) queryParams.append("agent_id", agentId);
  if (limit) queryParams.append("limit", limit.toString());
  
  // Add date filters if provided
  if (fromDate) {
    const unixTime = Math.floor(fromDate.getTime() / 1000);
    queryParams.append("start_time_unix_gte", unixTime.toString());
  }
  
  if (toDate) {
    const unixTime = Math.floor(toDate.getTime() / 1000);
    queryParams.append("end_time_unix_lte", unixTime.toString());
  }
  
  const url = `${ELEVENLABS_API_BASE_URL}/convai/conversations?${queryParams.toString()}`;
  console.log(`Fetching ElevenLabs conversations: ${url}`);
  
  const response = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "xi-api-key": apiKey
    }
  }, 3, 1000, 10000);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  console.log(`Retrieved ${data.conversations?.length || 0} conversations from ElevenLabs API`);
  
  return data;
}

/**
 * Fetch all conversations from ElevenLabs API with automatic pagination
 */
export async function fetchAllElevenLabsConversations(
  apiKey = ELEVENLABS_API_KEY,
  options: FetchConversationsOptions & { maxPages?: number } = {}
): Promise<any[]> {
  const { maxPages = 5, ...fetchOptions } = options;
  let allConversations: any[] = [];
  let page = 1;
  
  while (page <= maxPages) {
    try {
      console.log(`Fetching conversations page ${page}...`);
      const data = await fetchElevenLabsConversations(apiKey, fetchOptions);
      
      if (!data.conversations || !Array.isArray(data.conversations) || data.conversations.length === 0) {
        console.log("No more conversations found or invalid response");
        break;
      }
      
      allConversations = [...allConversations, ...data.conversations];
      console.log(`Retrieved ${data.conversations.length} conversations (total: ${allConversations.length})`);
      
      // Check if we've reached the end
      if (data.conversations.length < (fetchOptions.limit || 100)) {
        console.log("Reached end of available conversations");
        break;
      }
      
      page++;
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }
  
  return allConversations;
}
