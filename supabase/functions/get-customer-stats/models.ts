
export interface CustomerStatsRequest {
  agentId: string;
}

export interface CustomerStats {
  customerId: string;
  customerName: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  lastCallDate: string | null;
}
