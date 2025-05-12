
/**
 * Types for the ElevenLabs History API
 */

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

export interface HistoryFetchResult {
  success: boolean;
  error?: string;
}
