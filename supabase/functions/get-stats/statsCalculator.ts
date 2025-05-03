
import { CustomerStatistics } from "./types.ts";

/**
 * Calculate statistics from call data
 */
export function calculateStats(calls: any[]): any {
  // Calculate basic stats
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
  
  const totalSatisfaction = calls.reduce((sum, call) => sum + (call.satisfaction_score || 0), 0);
  const avgSatisfaction = totalCalls > 0 ? totalSatisfaction / totalCalls : 0;
  
  // Group calls by date for the past 30 days
  const callsPerDay = calculateCallsPerDay(calls);
  
  // Get customer stats and top customers
  const topCustomers = calculateCustomerStats(calls);

  return {
    totalCalls,
    avgDuration,
    avgSatisfaction,
    callsPerDay,
    topCustomers
  };
}

/**
 * Group calls by date for the past 30 days
 */
function calculateCallsPerDay(calls: any[]): Record<string, number> {
  const today = new Date();
  const callsPerDay: Record<string, number> = {};
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Initialize all dates in the past 30 days with 0 calls
  for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    callsPerDay[dateStr] = 0;
  }

  // Count actual calls per day
  calls.forEach(call => {
    if (!call.date) return;
    const date = new Date(call.date).toISOString().split('T')[0];
    callsPerDay[date] = (callsPerDay[date] || 0) + 1;
  });

  return callsPerDay;
}

/**
 * Calculate customer statistics and get top customers
 */
function calculateCustomerStats(calls: any[]): CustomerStatistics[] {
  const customerStatsMap: Record<string, CustomerStatistics> = {};

  calls.forEach(call => {
    if (!call.customer_id) return;
    
    if (!customerStatsMap[call.customer_id]) {
      customerStatsMap[call.customer_id] = {
        customerId: call.customer_id,
        customerName: call.customer_name || "Client inconnu",
        totalCalls: 0,
        totalDuration: 0,
        totalSatisfaction: 0,
        lastCallDate: null
      };
    }
    
    customerStatsMap[call.customer_id].totalCalls += 1;
    customerStatsMap[call.customer_id].totalDuration += call.duration || 0;
    customerStatsMap[call.customer_id].totalSatisfaction += call.satisfaction_score || 0;
    
    // Update last call date if this call is more recent
    const callDate = new Date(call.date).getTime();
    const lastCallDate = customerStatsMap[call.customer_id].lastCallDate ? 
      new Date(customerStatsMap[call.customer_id].lastCallDate).getTime() : 0;
    
    if (!lastCallDate || callDate > lastCallDate) {
      customerStatsMap[call.customer_id].lastCallDate = call.date;
    }
  });

  return Object.values(customerStatsMap)
    .map((stat) => ({
      ...stat,
      avgDuration: stat.totalCalls > 0 ? stat.totalDuration / stat.totalCalls : 0,
      avgSatisfaction: stat.totalCalls > 0 ? stat.totalSatisfaction / stat.totalCalls : 0,
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 10); // Get top 10 customers
}
