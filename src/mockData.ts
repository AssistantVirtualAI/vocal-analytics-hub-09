
import { Agent, Call, Customer, CallStats, CustomerStats } from './types';

// Mock data objects - to be replaced with real API data
export const mockAgents: Agent[] = [];
export const mockCustomers: Customer[] = [];
export const mockCalls: Call[] = [];

// Empty call stats
export const mockCallStats: CallStats = {
  totalCalls: 0,
  avgDuration: 0,
  avgSatisfaction: 0,
  callsPerDay: {},
  lastUpdated: new Date().toISOString(),
  topCustomers: []
};

// Empty customer stats
export const mockCustomerStats: CustomerStats[] = [];

// Export all mock data in a single object for easier imports
export const mockData = {
  mockAgents,
  mockCustomers,
  mockCalls,
  mockCallStats,
  mockCustomerStats
};
