
import { HistoryItem } from "../_shared/elevenlabs/history-types.ts";
import { CallData } from "./models.ts";

/**
 * Convert a history item to call data for the database
 */
export function mapHistoryItemToCallData(
  item: HistoryItem, 
  agentId: string,
  supabaseUrl?: string
): CallData {
  console.log(`Mapping history item ${item.history_item_id} to call data`);
  
  // Construct the proxy audio URL that points to our edge function
  const audioUrl = supabaseUrl 
    ? `${supabaseUrl}/functions/v1/get-call-audio?history_id=${item.history_item_id}`
    : `https://api.elevenlabs.io/v1/history/${item.history_item_id}/audio`;
  
  return {
    id: item.history_item_id,
    audio_url: audioUrl,
    agent_id: agentId, // This should be the internal UUID
    date: new Date(item.created_at || (item.date_unix ? item.date_unix * 1000 : Date.now())).toISOString(),
    customer_id: null,
    customer_name: "Client inconnu",
    satisfaction_score: 0,
    duration: 0,
    transcript: item.text || "",
    elevenlabs_history_item_id: item.history_item_id // Store the original history item ID
  };
}
