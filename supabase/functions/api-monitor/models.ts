
export interface ApiRequest {
  functionName: string;
  duration: number;
  status: number;
  error?: string;
  timestamp: string;
}

export interface FunctionMetrics {
  totalRequests: number;
  successRequests: number;
  clientErrorRequests: number;
  serverErrorRequests: number;
  avgDuration: number;
}

export interface ApiMetricsResponse {
  totalRequests: number;
  successRequests: number;
  clientErrorRequests: number;
  serverErrorRequests: number;
  avgDuration: number;
  p95Duration: number;
  byFunction: Record<string, FunctionMetrics>;
  timeframe: string;
}
