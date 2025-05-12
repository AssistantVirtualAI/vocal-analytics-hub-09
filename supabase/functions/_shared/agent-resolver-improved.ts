
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Gets the UUID of an agent by its external ID, used in ElevenLabs
 * @param supabase Supabase client
 * @param externalAgentId External agent ID (e.g., "QNdB45Jpgh06Hr67TzFO")
 * @returns Internal UUID of the agent, or null if not found
 */
export async function getAgentUUIDByExternalId(
  supabase: SupabaseClient,
  externalAgentId: string
): Promise<string | null> {
  try {
    if (!externalAgentId) {
      console.log('[agent-resolver] No external agent ID provided');
      return null;
    }
    
    console.log(`[agent-resolver] Looking up agent with external ID: ${externalAgentId}`);
    
    // First, try to find by ID directly (in case externalAgentId is actually a UUID)
    const { data: directAgent, error: directError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", externalAgentId)
      .maybeSingle();
    
    if (directError) {
      console.error(`[agent-resolver] Error looking up agent by direct ID: ${directError.message}`);
    }
    
    if (directAgent) {
      console.log(`[agent-resolver] Found agent directly with ID: ${directAgent.id}`);
      return directAgent.id;
    }
    
    // If not found, try to find by name/external_id
    const { data: agent, error: nameError } = await supabase
      .from("agents")
      .select("id")
      .eq("name", externalAgentId)
      .maybeSingle();
    
    if (nameError) {
      console.error(`[agent-resolver] Error looking up agent by name: ${nameError.message}`);
    }
    
    if (agent) {
      console.log(`[agent-resolver] Found agent by name/external_id: ${agent.id}`);
      return agent.id;
    }

    // If still not found, check organizations table for agent_id
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (orgError) {
      console.error(`[agent-resolver] Error looking up organization by agent_id: ${orgError.message}`);
    }
    
    if (organization) {
      const defaultAgentId = "2df8e9d7-0939-4bd8-9da1-c99ac86eb2f8";
      console.log(`[agent-resolver] Found organization with agent_id: ${externalAgentId}, using default agent: ${defaultAgentId}`);
      return defaultAgentId; // Use actual UUID instead of special flag
    }
    
    console.log(`[agent-resolver] Agent not found for external ID: ${externalAgentId}`);
    return null;
  } catch (error) {
    console.error(`[agent-resolver] Unexpected error in getAgentUUIDByExternalId: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

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
      console.log('[agent-resolver] No user ID provided for access check');
      return false;
    }
    
    // If no organizationId or agentId provided, user has no access restrictions
    if (!organizationId && !agentId) {
      console.log('[agent-resolver] No organization or agent ID provided, access granted');
      return true;
    }

    console.log(`[agent-resolver] Checking access for user ${userId} to org: ${organizationId || 'none'}, agent: ${agentId || 'none'}`);

    // Check if user is a super admin
    const { data: adminData, error: adminError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (adminError) {
      console.error(`[agent-resolver] Error checking admin status: ${adminError.message}`);
    }
    
    if (adminData) {
      console.log(`[agent-resolver] User ${userId} is a super admin, access granted`);
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
        console.error(`[agent-resolver] Error checking user org membership: ${userOrgError.message}`);
      }

      if (userOrg) {
        console.log(`[agent-resolver] User ${userId} is member of org ${organizationId}, access granted`);
        return true;
      }
    }

    // If agentId is provided, check if user has access to any organization with this agent
    if (agentId) {
      // Get all organizations this user belongs to
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', userId);
        
      if (userOrgsError) {
        console.error(`[agent-resolver] Error fetching user organizations: ${userOrgsError.message}`);
      }
        
      if (!userOrgs || userOrgs.length === 0) {
        console.log(`[agent-resolver] User ${userId} doesn't belong to any organizations`);
        return false;
      }
      
      const orgIds = userOrgs.map(org => org.organization_id);
      console.log(`[agent-resolver] User ${userId} belongs to orgs: ${orgIds.join(', ')}`);
      
      // Check if any of these organizations has the specified agent
      const { data: orgWithAgent, error: orgWithAgentError } = await supabase
        .from('organizations')
        .select('id')
        .in('id', orgIds)
        .eq('agent_id', agentId)
        .maybeSingle();
        
      if (orgWithAgentError) {
        console.error(`[agent-resolver] Error checking orgs with agent: ${orgWithAgentError.message}`);
      }
        
      if (orgWithAgent) {
        console.log(`[agent-resolver] User ${userId} has access to agent ${agentId} through org ${orgWithAgent.id}`);
        return true;
      }
    }

    console.log(`[agent-resolver] User ${userId} does not have access to the specified resources`);
    return false;
  } catch (error) {
    console.error(`[agent-resolver] Unexpected error in checkUserOrganizationAccess: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create agent resolver functions
 * @param supabase Supabase client to use for database operations
 * @returns Object containing resolver functions
 */
export function createAgentResolver(supabase: SupabaseClient) {
  return {
    getAgentUUIDByExternalId: (externalAgentId: string) => 
      getAgentUUIDByExternalId(supabase, externalAgentId),
    checkUserOrganizationAccess: (userId: string, organizationId?: string, agentId?: string) => 
      checkUserOrganizationAccess(supabase, userId, organizationId, agentId)
  };
}
