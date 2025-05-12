
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo, logError } from "../_shared/agent-resolver/logger.ts";
import { buildCallsQuery } from "./query-builder.ts";
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
}: QueryCallsParams) {
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
          // If no specific agent was requested, filter by all the user's organization agents
          if (!agentUUIDForQuery) {
            // Build and execute query with user's organization agents
            logInfo("Executing query on calls_view with organization agent filters.");
            const query = buildCallsQuery({
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
              userOrgAgentIds: agentIds
            });
            
            const { data: callsData, error: queryError, count: totalCount } = await query;

            if (queryError) {
              logError(`Database query error occurred on calls_view: ${queryError.message}`);
              throw queryError;
            }
            
            return formatCallsResults(callsData, totalCount);
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

  // Build and execute query (either for superadmin or for specific agent request)
  logInfo("Executing final query on calls_view.");
  const query = buildCallsQuery({
    supabase,
    agentUUIDForQuery,
    limit,
    offset,
    sort,
    order,
    search,
    customerId,
    startDate,
    endDate
  });
  
  const { data: callsData, error: queryError, count: totalCount } = await query;

  if (queryError) {
    logError(`Database query error occurred on calls_view: ${queryError.message}`);
    throw queryError;
  }
  
  return formatCallsResults(callsData, totalCount);
}
