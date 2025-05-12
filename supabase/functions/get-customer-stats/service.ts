
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CustomerStats } from "./models.ts";

export async function getCustomers(supabase: SupabaseClient) {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*');
  
  if (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
  
  return customers || [];
}

export async function getCalls(supabase: SupabaseClient, agentId?: string) {
  let query = supabase
    .from('calls')
    .select(`
      id,
      customer_id,
      date,
      duration,
      satisfaction_score,
      customers(name)
    `)
    .order('date', { ascending: false });
  
  // Filter by agent if provided
  if (agentId) {
    query = query.eq('agent_id', agentId);
  }
  
  const { data: calls, error } = await query;
  
  if (error) {
    console.error("Error fetching calls:", error);
    throw error;
  }
  
  return calls || [];
}

export function calculateCustomerStats(customers: any[], calls: any[]): CustomerStats[] {
  // Create a map to store statistics for each customer
  const customerStatsMap = new Map();
  
  // Initialize customer stats with basic info
  customers.forEach(customer => {
    customerStatsMap.set(customer.id, {
      customerId: customer.id,
      customerName: customer.name || "Unknown Customer",
      totalCalls: 0,
      totalDuration: 0,
      totalSatisfaction: 0,
      lastCallDate: null
    });
  });
  
  // Process calls to calculate statistics
  calls.forEach(call => {
    const customerId = call.customer_id;
    if (!customerStatsMap.has(customerId)) return;
    
    const stats = customerStatsMap.get(customerId);
    stats.totalCalls++;
    stats.totalDuration += call.duration || 0;
    
    if (call.satisfaction_score) {
      stats.totalSatisfaction += call.satisfaction_score;
    }
    
    // Update last call date if this call is more recent
    const callDate = new Date(call.date);
    if (!stats.lastCallDate || callDate > new Date(stats.lastCallDate)) {
      stats.lastCallDate = call.date;
    }
    
    // Update customer name from the joined customers record if available
    if (call.customers && call.customers.name) {
      stats.customerName = call.customers.name;
    }
  });
  
  // Calculate averages and format final stats
  return Array.from(customerStatsMap.values()).map(stats => {
    const avgDuration = stats.totalCalls > 0 ? stats.totalDuration / stats.totalCalls : 0;
    const avgSatisfaction = stats.totalCalls > 0 ? stats.totalSatisfaction / stats.totalCalls : 0;
    
    return {
      customerId: stats.customerId,
      customerName: stats.customerName,
      totalCalls: stats.totalCalls,
      avgDuration,
      avgSatisfaction,
      lastCallDate: stats.lastCallDate
    };
  });
}
