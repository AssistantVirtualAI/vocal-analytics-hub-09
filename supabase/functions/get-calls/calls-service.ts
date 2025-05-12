
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FormattedCall } from "./types.ts";
import { logInfo, logError } from "../_shared/agent-resolver/logger.ts";

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

/**
 * Query calls from the database
 */
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
}: QueryCallsParams): Promise<{ calls: FormattedCall[], totalCount: number | null }> {
  let query = supabase.from("calls_view").select("*", { count: "exact" });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (customerId) query = query.eq('customer_id', customerId);
  
  // Apply agent filter if provided
  if (agentUUIDForQuery) {
    logInfo(`Applying filter: query.eq("agent_id", "${agentUUIDForQuery}")`);
    query = query.eq('agent_id', agentUUIDForQuery);
  }
  
  if (!isSuperAdmin) {
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
          // If we already have an agent filter, no need to apply this
          if (!agentUUIDForQuery) {
            logInfo(`Restricting to user's organization agents: ${agentIds.join(', ')}`);
            query = query.in('agent_id', agentIds);
          }
        } else {
          // User has organization access but no agents are set
          logInfo(`User's organizations have no agents configured`);
          return { calls: [], totalCount: 0 };
        }
      } else {
        // User has no organizations with agents
        logInfo(`User's organizations not found or have no agents`);
        return { calls: [], totalCount: 0 };
      }
    } else {
      // User doesn't belong to any organizations
      logInfo(`User doesn't belong to any organizations`);
      return { calls: [], totalCount: 0 };
    }
  }

  if (search) query = query.or(`customer_name.ilike.%${search}%,agent_name.ilike.%${search}%`);
  
  query = query.order(sort, { ascending: order === 'asc' });
  query = query.range(offset, offset + limit - 1);
  
  logInfo("Executing final query on calls_view.");
  const { data: callsData, error: queryError, count: totalCount } = await query;

  if (queryError) {
    logError(`Database query error occurred on calls_view: ${queryError.message}`);
    throw queryError;
  }

  logInfo(`Successfully retrieved ${callsData?.length || 0} calls. Total count: ${totalCount}`);
  
  const formattedCalls = callsData?.map(call => ({
    id: call.id,
    customer_id: call.customer_id || null,
    customer_name: call.customer_name || "Client inconnu",
    agent_id: call.agent_id || null, 
    agent_name: call.agent_name || "Agent inconnu",
    date: call.date || new Date().toISOString(),
    duration: call.duration || 0,
    satisfaction_score: call.satisfaction_score || 0,
    audio_url: call.audio_url || "",
    summary: call.summary || "",
    transcript: call.transcript || "",
    tags: call.tags || []
  })) || [];

  return { calls: formattedCalls, totalCount };
}
