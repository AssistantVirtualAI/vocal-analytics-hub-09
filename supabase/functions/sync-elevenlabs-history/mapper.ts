
import { HistoryItem } from "../_shared/elevenlabs/history-types.ts";

/**
 * Map an ElevenLabs history item to call data for database storage
 */
export function mapHistoryItemToCallData(
  item: HistoryItem,
  agentId: string,
  supabaseUrl?: string
): Record<string, any> {
  // Base audio URL for ElevenLabs history items
  const baseAudioUrl = "https://api.elevenlabs.io/v1/history/";
  
  // Format the date (ElevenLabs uses Unix timestamp)
  const dateObj = item.date_unix 
    ? new Date(item.date_unix * 1000) 
    : new Date();

  // Default customer name (can be updated later)
  const customerName = item.request_id?.startsWith("call-")
    ? (item.request_id.split("-")[2] || "Unknown")
    : "ElevenLabs Customer";

  // Extract any available call duration
  const duration = item.character_count 
    ? Math.max(1, Math.floor(item.character_count / 20)) // Simple estimation: ~20 chars per second
    : 60; // Default 1 minute if not available
  
  // Create the call data object with new elevenlabs_history_item_id field
  return {
    id: item.history_item_id,
    elevenlabs_history_item_id: item.history_item_id, // Set the new field
    date: dateObj.toISOString(),
    duration: duration,
    satisfaction_score: Math.floor(Math.random() * 5) + 1, // Random 1-5 score
    audio_url: `${baseAudioUrl}${item.history_item_id}/audio`,
    transcript: item.text || "",
    customer_name: customerName,
    agent_id: agentId,
    source: "elevenlabs"
  };
}
