
export interface CallRequest {
  callId: string;
}

export interface CallResponse {
  id: string;
  customer_id: string;
  customer_name?: string;
  agent_id: string;
  agent_name?: string;
  date: string;
  duration: number;
  audio_url?: string;
  summary?: string;
  transcript?: string;
  satisfaction_score?: number;
  tags?: string[];
  [key: string]: unknown;
}
