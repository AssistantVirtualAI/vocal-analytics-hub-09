
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
  console.log(`[agent-resolver] Looking up agent with external ID: ${externalAgentId}`);
  
  // First, try to find by ID directly (in case externalAgentId is actually a UUID)
  const { data: directAgent } = await supabase
    .from("agents")
    .select("id")
    .eq("id", externalAgentId)
    .maybeSingle();
  
  if (directAgent) {
    console.log(`[agent-resolver] Found agent directly with ID: ${directAgent.id}`);
    return directAgent.id;
  }
  
  // If not found, try to find by name/external_id
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("name", externalAgentId)
    .maybeSingle();
  
  if (agent) {
    console.log(`[agent-resolver] Found agent by name/external_id: ${agent.id}`);
    return agent.id;
  }

  // If still not found, check organizations table for agent_id
  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .eq("agent_id", externalAgentId)
    .maybeSingle();
  
  if (organization) {
    console.log(`[agent-resolver] Found organization with agent_id: ${externalAgentId}, using default agent`);
    return "2df8e9d7-0939-4bd8-9da1-c99ac86eb2f8"; // Use actual UUID instead of special flag
  }
  
  console.log(`[agent-resolver] Agent not found for external ID: ${externalAgentId}`);
  return null;
}

/**
 * Check if a user has access to an organization
 */
export async function checkUserOrganizationAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId?: string,
  agentId?: string
): Promise<boolean> {
  // If no organizationId or agentId provided, user has no access restrictions
  if (!organizationId && !agentId) {
    return true;
  }

  // Check if user is a member of the specified organization
  if (organizationId) {
    const { data: userOrg, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (userOrg) {
      return true;
    }
  }

  // If agentId is provided, check if user has access to any organization with this agent
  if (agentId) {
    // Get all organizations this user belongs to
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', userId);
      
    if (!userOrgs || userOrgs.length === 0) {
      return false;
    }
    
    const orgIds = userOrgs.map(org => org.organization_id);
    
    // Check if any of these organizations has the specified agent
    const { data: orgWithAgent } = await supabase
      .from('organizations')
      .select('id')
      .in('id', orgIds)
      .eq('agent_id', agentId)
      .maybeSingle();
      
    return !!orgWithAgent;
  }

  return false;
}

/**
 * Create agent resolver functions
 */
export function createAgentResolver(supabase: SupabaseClient) {
  return {
    getAgentUUIDByExternalId: (externalAgentId: string) => getAgentUUIDByExternalId(supabase, externalAgentId),
    checkUserOrganizationAccess: (userId: string, organizationId?: string, agentId?: string) => 
      checkUserOrganizationAccess(supabase, userId, organizationId, agentId)
  };
}
