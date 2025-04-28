
// Types for our application
export type Call = {
  id: string;
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  date: string;
  duration: number; // in seconds
  audioUrl: string;
  summary: string;
  transcript?: string;
  satisfactionScore: number; // 1-5
  tags?: string[];
};

export type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  avatar: string;
};

export type CallStats = {
  totalCalls: number;
  avgDuration: number; // in seconds
  avgSatisfaction: number; // 1-5
  callsPerDay: { [key: string]: number };
};

export type CustomerStats = {
  customerId: string;
  customerName: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
};
