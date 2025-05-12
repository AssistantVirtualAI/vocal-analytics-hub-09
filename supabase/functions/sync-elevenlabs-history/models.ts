
/**
 * Define interfaces for the sync-elevenlabs-history function
 */

export interface SyncResult {
  id: string;
  success: boolean;
  action?: string;
  error?: string;
}

export interface CallData {
  id: string;
  agent_id: string;
  date: string;
  duration: number;
  satisfaction_score: number;
  audio_url: string;
  transcript: string;
  customer_id: string | null;
  customer_name: string;
  elevenlabs_history_item_id?: string;
  [key: string]: any;
}

export interface ElevenLabsHistoryResponse {
  history: Array<{
    history_item_id: string;
    request_id: string;
    text: string;
    voice_id: string;
    date_unix: number;
    [key: string]: any;
  }>;
  last_history_item_id?: string;
  has_more?: boolean;
}
