
export interface SyncRequest {
  agentId: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  usePagination?: boolean;
}

export interface Conversation {
  id: string;
  agent_id: string;
  title?: string;
  start_time_unix: number;
  end_time_unix?: number;
  duration_seconds?: number;
  messages?: ConversationMessage[];
  [key: string]: any;
}

export interface ConversationMessage {
  id: string;
  role: string;
  text: string;
  timestamp_unix: number;
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
