
// Define interfaces for the sync-calls-elevenlabs function

export interface Call {
  id?: string;
  conversationId?: string;
  date: string;
  duration?: string;
  audioUrl?: string;
  transcript?: string;
  summary?: string;
  customerName?: string;
  evaluationResult?: string;
}

export interface SyncRequest {
  calls: Call[];
  agentId: string;
}

export interface SyncResult {
  id: string;
  success: boolean;
  action?: string;
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  results: SyncResult[];
  summary: {
    total: number;
    success: number;
    error: number;
  };
  error?: string;
}

export interface CallData {
  id: string;
  duration: number;
  satisfaction_score: number;
  date: string;
  audio_url: string;
  transcript: string;
  summary?: string;
  agent_id: string;
  customer_id: string;
}
