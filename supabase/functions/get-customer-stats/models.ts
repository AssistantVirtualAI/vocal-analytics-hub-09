
export interface CustomerStatsRequest {
  agentId: string;
  startDate?: string;
  endDate?: string;
}

export interface CustomerStats {
  customerId: string;
  customerName: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  lastCallDate: string | null;
}

export interface Customer {
  id: string;
  name: string;
}

export interface Call {
  id: string;
  customer_id: string;
  date: string;
  duration: number;
  satisfaction_score?: number;
}
