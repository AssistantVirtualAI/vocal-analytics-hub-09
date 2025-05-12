
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo, logError } from "./logger.ts";

/**
 * Check if a user has access to an organization
 * @param supabase Supabase client
 * @param userId User ID to check access for
 * @param organizationId Optional organization ID to check access against
 * @param agentId Optional agent ID to check access against
 * @returns Boolean indicating if user has access
 */
export async function checkUserOrganizationAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId?: string,
  agentId?: string
): Promise<boolean> {
  try {
    if (!userId) {
      logInfo('No user ID provided for access check');
      return false;
    }
    
    // If no organizationId or agentId provided, user has no access restrictions
    if (!organizationId && !agentId) {
      logInfo('No organization or agent ID provided, access granted');
      return true;
    }

    logInfo(`Checking access for user ${userId} to org: ${organizationId || 'none'}, agent: ${agentId || 'none'}`);

    // Check if user is a super admin
    const { data: adminData, error: adminError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (adminError) {
      logError(`Error checking admin status: ${adminError.message}`);
    }
    
    if (adminData) {
      logInfo(`User ${userId} is a super admin, access granted`);
      return true;
    }

    // Check if user is a member of the specified organization
    if (organizationId) {
      const { data: userOrg, error: userOrgError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (userOrgError) {
        logError(`Error checking user org membership: ${userOrgError.message}`);
      }

      if (userOrg) {
        logInfo(`User ${userId} is member of org ${organizationId}, access granted`);
        return true;
      }
    }

    // If agentId is provided, check if user has access to any organization with this agent
    if (agentId) {
      return await checkUserAgentAccess(supabase, userId, agentId);
    }

    logInfo(`User ${userId} does not have access to the specified resources`);
    return false;
  } catch (error) {
    logError(`Unexpected error in checkUserOrganizationAccess: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Check if user has access to the specified agent through any organization
 * @param supabase Supabase client 
 * @param userId User ID to check
 * @param agentId Agent ID to check access for
 * @returns Boolean indicating if user has access
 */
async function checkUserAgentAccess(
  supabase: SupabaseClient,
  userId: string,
  agentId: string
): Promise<boolean> {
  // Get all organizations this user belongs to
  const { data: userOrgs, error: userOrgsError } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', userId);
    
  if (userOrgsError) {
    logError(`Error fetching user organizations: ${userOrgsError.message}`);
  }
    
  if (!userOrgs || userOrgs.length === 0) {
    logInfo(`User ${userId} doesn't belong to any organizations`);
    return false;
  }
  
  const orgIds = userOrgs.map(org => org.organization_id);
  logInfo(`User ${userId} belongs to orgs: ${orgIds.join(', ')}`);
  
  // Check if any of these organizations has the specified agent
  const { data: orgWithAgent, error: orgWithAgentError } = await supabase
    .from('organizations')
    .select('id')
    .in('id', orgIds)
    .eq('agent_id', agentId)
    .maybeSingle();
    
  if (orgWithAgentError) {
    logError(`Error checking orgs with agent: ${orgWithAgentError.message}`);
  }
    
  if (orgWithAgent) {
    logInfo(`User ${userId} has access to agent ${agentId} through org ${orgWithAgent.id}`);
    return true;
  }
  
  return false;
}
