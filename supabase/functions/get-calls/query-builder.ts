
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo } from "../_shared/agent-resolver/logger.ts";

interface QueryBuilderParams {
  supabase: SupabaseClient;
  agentUUIDForQuery: string | null;
  limit: number;
  offset: number;
  sort: string;
  order: string;
  search: string;
  customerId: string;
  startDate: string;
  endDate: string;
  userOrgAgentIds?: string[];
}

/**
 * Build a query for the calls_view table
 */
export function buildCallsQuery({
  supabase,
  agentUUIDForQuery,
  limit,
  offset,
  sort,
  order,
  search,
  customerId,
  startDate,
  endDate,
  userOrgAgentIds
}: QueryBuilderParams) {
  let query = supabase.from("calls_view").select("*", { count: "exact" });

  // Apply date filters
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (customerId) query = query.eq('customer_id', customerId);
  
  // Apply agent filter if provided
  if (agentUUIDForQuery) {
    logInfo(`Applying filter: query.eq("agent_id", "${agentUUIDForQuery}")`);
    query = query.eq('agent_id', agentUUIDForQuery);
  } 
  // Apply organization agents filter if provided
  else if (userOrgAgentIds && userOrgAgentIds.length > 0) {
    logInfo(`Restricting to user's organization agents: ${userOrgAgentIds.join(', ')}`);
    query = query.in('agent_id', userOrgAgentIds);
  }

  // Apply search filter if provided
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
  }
  
  // Apply sorting and pagination
  query = query.order(sort, { ascending: order === 'asc' });
  query = query.range(offset, offset + limit - 1);
  
  return query;
}
