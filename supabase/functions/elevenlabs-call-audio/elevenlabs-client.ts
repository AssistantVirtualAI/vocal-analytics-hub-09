
// ElevenLabs API client for audio retrieval
import { fetchWithRetry } from "../_shared/fetch-with-retry.ts";
import { 
  fetchElevenLabsConversationTranscript,
  getElevenLabsConversationAudioUrl 
} from "../_shared/elevenlabs/conversations.ts";
import { fetchElevenLabsHistoryItem } from "../_shared/elevenlabs/history.ts";
import { ELEVENLABS_API_BASE_URL, handleElevenLabsApiError } from "../_shared/elevenlabs/client.ts";
import { safeGetEnv } from "../_shared/env.ts";

// Get API key from environment variables
export function getElevenLabsApiKey(): string {
  const apiKey = safeGetEnv("ELEVENLABS_API_KEY") || safeGetEnv("ELEVEN_LABS_API_KEY");
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is missing");
  }
  return apiKey;
}

/**
 * Fetch audio URL from ElevenLabs for a given conversation
 */
export async function getElevenLabsAudioUrl(conversationId: string, useConversationalApi = true) {
  const apiKey = getElevenLabsApiKey();
  
  if (useConversationalApi) {
    return getElevenLabsConversationAudioUrl(conversationId);
  } else {
    // Legacy approach - use history item audio endpoint
    return `${ELEVENLABS_API_BASE_URL}/history/${conversationId}/audio`;
  }
}

/**
 * Fetch transcript from ElevenLabs for a given conversation
 */
export async function getElevenLabsTranscript(conversationId: string, useConversationalApi = true) {
  const apiKey = getElevenLabsApiKey();
  
  try {
    if (useConversationalApi) {
      const transcriptData = await fetchElevenLabsConversationTranscript(conversationId, apiKey);
      return transcriptData.transcript?.map(item => item.text).join(" ") || "";
    } else {
      // Legacy approach - use history item text
      const historyItem = await fetchElevenLabsHistoryItem(conversationId, apiKey);
      return historyItem.text || "";
    }
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}

/**
 * Check if audio exists for a given conversation without downloading the full content
 */
export async function checkElevenLabsAudioExists(audioUrl: string) {
  const apiKey = getElevenLabsApiKey();
  
  try {
    const response = await fetch(audioUrl, {
      method: "HEAD",
      headers: {
        "xi-api-key": apiKey,
      },
    });
    
    return response.ok && response.headers.get("Content-Type")?.includes("audio");
  } catch (error) {
    console.error("Error checking audio existence:", error);
    return false;
  }
}

/**
 * Generate text statistics from transcript
 */
export function generateTextStatistics(transcript: string) {
  if (!transcript) {
    return {
      totalWords: 0,
      totalCharacters: 0,
      averageWordLength: 0,
      wordsPerMinute: 0,
    };
  }
  
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  const totalCharacters = transcript.replace(/\s/g, "").length;
  const averageWordLength = totalWords > 0 ? totalCharacters / totalWords : 0;
  
  return {
    totalWords,
    totalCharacters,
    averageWordLength: parseFloat(averageWordLength.toFixed(2)),
  };
}
