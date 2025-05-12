
export interface CallsQueryParams {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
  search?: string;
  customerId?: string;
  agentId?: string;
  startDate?: string;
  endDate?: string;
  orgId?: string;
  satisfactionScore?: number;
}

export interface FormattedCall {
  id: string;
  customer_id: string | null;
  customer_name: string;
  agent_id: string | null;
  agent_name: string;
  date: string;
  duration: number;
  satisfaction_score: number;
  audio_url: string;
  summary: string;
  transcript: string;
  tags: string[];
}
