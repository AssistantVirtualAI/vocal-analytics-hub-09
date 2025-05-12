
/**
 * Type definitions for ElevenLabs history data
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

export interface HistoryFetchOptions {
  pageSize?: number;
  maxItems?: number;
  filterByVoiceId?: boolean;
}

export interface HistoryFetchResult {
  success: boolean;
  data?: HistoryItem[];
  error?: string;
}
