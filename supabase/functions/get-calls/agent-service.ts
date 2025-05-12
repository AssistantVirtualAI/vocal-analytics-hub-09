
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId, checkUserOrganizationAccess } from "../_shared/agent-resolver/index.ts";
import { logInfo, logError } from "../_shared/agent-resolver/logger.ts";

/**
 * Process agent ID from request and get internal UUID
 * @param supabase Supabase client
 * @param externalAgentId External agent ID
 * @param userId User ID
 * @param isSuperAdmin Boolean indicating if user is a super admin
 * @returns Internal agent UUID or null
 */
export async function processAgentId(
  supabase: SupabaseClient, 
  externalAgentId: string, 
  userId: string, 
  isSuperAdmin: boolean
): Promise<string | null> {
  if (!externalAgentId) return null;
  
  logInfo(`externalAgentIdFromRequest is '${externalAgentId}', attempting to get internal UUID.`);
  const agentUUIDForQuery = await getAgentUUIDByExternalId(supabase, externalAgentId);
  logInfo(`Result from getAgentUUIDByExternalId: '${agentUUIDForQuery}'`);

  if (!agentUUIDForQuery) {
    return null;
  }
  
  // Verify user has access to this agent
  if (!isSuperAdmin) {
    const hasAccess = await checkUserOrganizationAccess(supabase, userId, undefined, agentUUIDForQuery);
    if (!hasAccess) {
      logError(`User ${userId} does not have access to agent ${agentUUIDForQuery}`);
      return null;
    }
  }
  
  return agentUUIDForQuery;
}
