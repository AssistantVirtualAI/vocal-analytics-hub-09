
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo, logError } from "../_shared/agent-resolver/logger.ts";
import { getAgentUUIDByExternalId } from "../_shared/agent-resolver/index.ts";

/**
 * Process and validate agent ID
 */
export async function processAgentId(
  supabase: SupabaseClient,
  externalAgentIdFromRequest: string,
  userId: string,
  isSuperAdmin: boolean
): Promise<string | null> {
  if (!externalAgentIdFromRequest) {
    return null;
  }
  
  logInfo(`externalAgentIdFromRequest is '${externalAgentIdFromRequest}', attempting to get internal UUID.`);
  const agentUUIDForQuery = await getAgentUUIDByExternalId(supabase, externalAgentIdFromRequest);
  logInfo(`Result from getAgentUUIDByExternalId: '${agentUUIDForQuery}'`);
  
  if (!agentUUIDForQuery) {
    return null;
  }
  
  // Verify user has access to this agent if they're not a super admin
  if (!isSuperAdmin) {
    const { data: userOrgAgents } = await supabase
      .from('user_organizations')
      .select('organizations!inner(agent_id)')
      .eq('user_id', userId);
      
    const userAgentIds = userOrgAgents?.map(record => 
      record.organizations?.agent_id
    ).filter(Boolean) || [];
    
    const { data: agentExternalIds } = await supabase
      .from('agent_identifiers')
      .select('external_id')
      .eq('agent_id', agentUUIDForQuery);
      
    const externalIds = agentExternalIds?.map(record => record.external_id) || [];
    
    const hasAccess = userAgentIds.some(id => 
      id === agentUUIDForQuery || externalIds.includes(id)
    );
    
    if (!hasAccess) {
      logError(`User ${userId} does not have access to agent ${agentUUIDForQuery}`);
      return null;
    }
  }
  
  return agentUUIDForQuery;
}
