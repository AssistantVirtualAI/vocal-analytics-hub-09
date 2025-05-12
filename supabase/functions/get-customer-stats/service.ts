
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Customer, Call, CustomerStats } from "./models.ts";
import { createAgentResolver } from "../_shared/agent-resolver-improved.ts";

export async function getCustomers(supabase: SupabaseClient): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name');

  if (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }

  return data || [];
}

export async function getCalls(supabase: SupabaseClient, agentId: string): Promise<Call[]> {
  try {
    // Use the agent resolver to convert from external ID to UUID if needed
    const agentResolver = createAgentResolver(supabase);
    let agentUUID = await agentResolver.getAgentUUIDByExternalId(agentId);
    
    if (!agentUUID) {
      console.warn(`No agent found with ID: ${agentId}`);
      return [];
    }

    // Now fetch calls with the resolved UUID
    let query = supabase
      .from('calls')
      .select('id, customer_id, date, duration, satisfaction_score');
    
    // Only add the agent filter if we have a valid UUID and it's not the special "no filter" value
    if (agentUUID !== 'USE_NO_FILTER') {
      query = query.eq('agent_id', agentUUID);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching calls:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("Error in getCalls:", err);
    return [];
  }
}

export function calculateCustomerStats(customers: Customer[], calls: Call[]): CustomerStats[] {
  // Group calls by customer
  const callsByCustomer = calls.reduce((acc, call) => {
    if (!acc[call.customer_id]) {
      acc[call.customer_id] = [];
    }
    acc[call.customer_id].push(call);
    return acc;
  }, {} as Record<string, Call[]>);
  
  // Calculate stats for each customer
  return customers.map(customer => {
    const customerCalls = callsByCustomer[customer.id] || [];
    const totalCalls = customerCalls.length;
    
    if (totalCalls === 0) {
      return {
        customerId: customer.id,
        customerName: customer.name,
        totalCalls: 0,
        avgDuration: 0,
        avgSatisfaction: 0,
        lastCallDate: null
      };
    }
    
    // Calculate total duration and satisfaction
    const totalDuration = customerCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const callsWithSatisfaction = customerCalls.filter(call => call.satisfaction_score !== undefined && call.satisfaction_score !== null);
    const totalSatisfaction = callsWithSatisfaction.reduce((sum, call) => sum + (call.satisfaction_score || 0), 0);
    
    // Find the most recent call
    const sortedCalls = [...customerCalls].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastCallDate = sortedCalls.length > 0 ? sortedCalls[0].date : null;
    
    return {
      customerId: customer.id,
      customerName: customer.name,
      totalCalls,
      avgDuration: totalDuration / totalCalls,
      avgSatisfaction: callsWithSatisfaction.length > 0 ? totalSatisfaction / callsWithSatisfaction.length : 0,
      lastCallDate
    };
  });
}
