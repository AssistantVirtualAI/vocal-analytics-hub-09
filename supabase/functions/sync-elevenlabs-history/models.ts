
export interface SyncRequest {
  agentId: string;
}

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
}

export interface SyncResult {
  id: string;
  success: boolean;
  action?: string;
  error?: string;
}

export interface SyncSummary {
  total: number;
  success: number;
  error: number;
}

export interface SyncResponse {
  success: boolean;
  results: SyncResult[];
  summary: SyncSummary;
}

export interface CallData {
  id: string;
  audio_url: string;
  agent_id: string;
  date: string;
  customer_id?: string | null;
  customer_name?: string;
  satisfaction_score?: number;
  duration: number;
  transcript?: string;
}
