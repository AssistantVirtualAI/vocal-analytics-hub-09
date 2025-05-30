
export interface Organization {
  id: string;
  name: string;
  agentId?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface CallStats {
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  callsPerDay: Record<string, number>;
  lastUpdated: string;
  topCustomers: CustomerStats[];
}

export interface CustomerStats {
  customerId: string;
  customerName: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  lastCallDate: string | null;
}

export interface Call {
  id: string;
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  date: string;
  duration: number;
  audioUrl: string;
  summary: string;
  transcript?: string;
  satisfactionScore: number;
  tags: string[];
}

// Add missing types for Agent and Customer
export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
}
