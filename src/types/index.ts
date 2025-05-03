
import { DateRange } from "./calendar";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface Agent {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
}

export interface Organization {
  id: string;
  name: string;
  agentId?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt?: string;
  users?: User[];
}

export interface Call {
  id: string;
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  date: string;
  duration: number;
  audioUrl?: string;
  summary?: string;
  transcript?: string;
  satisfactionScore: number;
  tags?: string[];
}

export interface CustomerStats {
  customerId: string;
  customerName: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  lastCall?: string;
}

export interface CallStats {
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  callsPerDay: Record<string, number>;
  lastUpdated: string;
  topCustomers?: CustomerStats[];
}

export interface AgentStats {
  id: string;
  name: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
}

export type UserRole = "admin" | "user" | "guest";
