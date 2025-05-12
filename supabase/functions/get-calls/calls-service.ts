
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo } from "../_shared/agent-resolver/logger.ts";
import { formatCallsResults } from "./result-formatter.ts";

interface QueryCallsParams {
  supabase: SupabaseClient;
  user: any;
  isSuperAdmin: boolean;
  agentUUIDForQuery: string | null;
  limit: number;
  offset: number;
  sort: string;
  order: string;
  search: string;
  customerId: string;
  startDate: string;
  endDate: string;
}

export async function queryCalls({
  supabase,
  user,
  isSuperAdmin,
  agentUUIDForQuery,
  limit,
  offset,
  sort,
  order,
  search,
  customerId,
  startDate,
  endDate
}: QueryCallsParams) {
  let query = supabase.from("calls_view").select("*", { count: "exact" });

  // Apply date filters
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  
  // Apply customer filter
  if (customerId) query = query.eq('customer_id', customerId);
  
  // Apply agent filter if provided
  if (agentUUIDForQuery) {
    logInfo(`Applying filter: query.eq("agent_id", "${agentUUIDForQuery}")`);
    query = query.eq('agent_id', agentUUIDForQuery);
  }
  
  // For non-super admins, restrict to organizations they belong to
  if (!isSuperAdmin && !agentUUIDForQuery) {
    // Get list of organizations the user belongs to
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id);
      
    if (userOrgs && userOrgs.length > 0) {
      const orgIds = userOrgs.map(org => org.organization_id);
      
      // Get list of agent IDs belonging to these organizations
      const { data: orgAgents } = await supabase
        .from('organizations')
        .select('agent_id')
        .in('id', orgIds);
        
      if (orgAgents && orgAgents.length > 0) {
        const agentIds = orgAgents
          .map(org => org.agent_id)
          .filter(Boolean); // Remove any null/undefined values
          
        if (agentIds.length > 0) {
          logInfo(`Restricting to user's organization agents`);
          query = query.in('agent_id', agentIds);
        }
      }
    }
  }

  // Apply search filter
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
  }
  
  // Apply sorting and pagination
  query = query.order(sort, { ascending: order === 'asc' });
  query = query.range(offset, offset + limit - 1);
  
  logInfo("Executing final query on calls_view.");
  const { data: callsData, error: queryError, count: totalCount } = await query;

  if (queryError) {
    throw queryError;
  }

  logInfo(`Retrieved ${callsData?.length || 0} calls. Total count: ${totalCount}`);
  
  return formatCallsResults(callsData, totalCount);
}
