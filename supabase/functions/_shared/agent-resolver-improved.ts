
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Improved agent resolver that handles both internal UUIDs and external IDs
export async function getAgentUUIDByExternalId(
  supabase: SupabaseClient,
  externalAgentId: string
): Promise<string | null> {
  // First, see if the provided ID is a UUID format (internal ID)
  if (isValidUUID(externalAgentId)) {
    console.log(`[getAgentUUIDByExternalId] Input appears to be a valid UUID: ${externalAgentId}`);
    try {
      // Verify that this UUID exists in our agents table
      const { data, error } = await supabase
        .from("agents")
        .select("id")
        .eq("id", externalAgentId)
        .single();

      if (error) {
        console.warn(`[getAgentUUIDByExternalId] Error verifying UUID: ${error.message}`);
        return null;
      }

      if (data) {
        console.log(`[getAgentUUIDByExternalId] Confirmed existing UUID: ${externalAgentId}`);
        return externalAgentId;
      }
    } catch (err) {
      console.error("[getAgentUUIDByExternalId] Error checking UUID:", err);
    }
  }

  // If it's not a UUID or wasn't found, try to find by external_id
  console.log(`[getAgentUUIDByExternalId] Looking up agent by external_id: ${externalAgentId}`);
  try {
    const { data, error } = await supabase
      .from("agents")
      .select("id")
      .eq("external_id", externalAgentId)
      .single();

    if (error) {
      console.warn(`[getAgentUUIDByExternalId] Error finding by external_id: ${error.message}`);
      return null;
    }

    if (data && data.id) {
      console.log(`[getAgentUUIDByExternalId] Found agent UUID ${data.id} for external ID ${externalAgentId}`);
      return data.id;
    }
  } catch (err) {
    console.error("[getAgentUUIDByExternalId] Error looking up external_id:", err);
  }

  console.warn(`[getAgentUUIDByExternalId] No agent found for identifier: ${externalAgentId}`);
  return null;
}

// UUID validation helper
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Function to check if a user has access to an organization or specific agent
export async function checkUserOrganizationAccess(
  supabase: SupabaseClient,
  userId: string,
  organizationId?: string,
  agentId?: string
): Promise<boolean> {
  try {
    console.log(`[checkUserOrganizationAccess] Checking access for user ${userId}, org ${organizationId || 'none'}, agent ${agentId || 'none'}`);
    
    // Check if user is a super admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
      
    if (roleError) {
      console.error(`[checkUserOrganizationAccess] Error checking admin role: ${roleError.message}`);
    } else if (roleData) {
      console.log(`[checkUserOrganizationAccess] User ${userId} is a super admin, granting access`);
      return true; // Super admins have access to everything
    }
    
    // If organization ID is provided, check membership
    if (organizationId) {
      const { data: orgData, error: orgError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      if (orgError) {
        console.error(`[checkUserOrganizationAccess] Error checking org membership: ${orgError.message}`);
      } else if (orgData) {
        console.log(`[checkUserOrganizationAccess] User ${userId} belongs to org ${organizationId}, granting access`);
        return true;
      }
    }
    
    // If agent ID is provided, check organization ownership of the agent
    if (agentId && userId) {
      // First get the organization(s) that the agent belongs to
      const { data: agentOrgData, error: agentOrgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('agent_id', agentId);
        
      if (agentOrgError) {
        console.error(`[checkUserOrganizationAccess] Error checking agent org: ${agentOrgError.message}`);
      } else if (agentOrgData && agentOrgData.length > 0) {
        // Check if user belongs to any of those organizations
        const orgIds = agentOrgData.map(org => org.id);
        
        const { data: userOrgData, error: userOrgError } = await supabase
          .from('user_organizations')
          .select('*')
          .eq('user_id', userId)
          .in('organization_id', orgIds);
          
        if (userOrgError) {
          console.error(`[checkUserOrganizationAccess] Error checking user orgs: ${userOrgError.message}`);
        } else if (userOrgData && userOrgData.length > 0) {
          console.log(`[checkUserOrganizationAccess] User ${userId} belongs to an org with agent ${agentId}, granting access`);
          return true;
        }
      }
    }
    
    console.log(`[checkUserOrganizationAccess] No access granted for user ${userId}`);
    return false;
  } catch (error) {
    console.error('[checkUserOrganizationAccess] Unexpected error:', error);
    return false;
  }
}
