
/**
 * Customer statistics interface
 */
export interface CustomerStatistics {
  customerId: string;
  customerName: string;
  totalCalls: number;
  totalDuration: number;
  totalSatisfaction: number;
  lastCallDate: string | null;
  avgDuration?: number;
  avgSatisfaction?: number;
}

/**
 * Call statistics response interface
 */
export interface CallStatistics {
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  callsPerDay: Record<string, number>;
  topCustomers: CustomerStatistics[];
}
