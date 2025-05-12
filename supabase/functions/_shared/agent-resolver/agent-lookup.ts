
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo, logError } from "./logger.ts";

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
      logInfo('No external agent ID provided');
      return null;
    }
    
    logInfo(`Looking up agent with external ID: ${externalAgentId}`);
    
    // First, try to find by ID directly (in case externalAgentId is actually a UUID)
    const { data: directAgent, error: directError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", externalAgentId)
      .maybeSingle();
    
    if (directError) {
      logError(`Error looking up agent by direct ID: ${directError.message}`);
    }
    
    if (directAgent) {
      logInfo(`Found agent directly with ID: ${directAgent.id}`);
      return directAgent.id;
    }
    
    // If not found, try to find by external_id or name
    const { data: agent, error: externalIdError } = await supabase
      .from("agents")
      .select("id")
      .eq("external_id", externalAgentId)
      .maybeSingle();
    
    if (externalIdError) {
      logError(`Error looking up agent by external_id: ${externalIdError.message}`);
    }
    
    if (agent) {
      logInfo(`Found agent by external_id: ${agent.id}`);
      return agent.id;
    }
    
    // Try by name as fallback
    const { data: nameAgent, error: nameError } = await supabase
      .from("agents")
      .select("id")
      .eq("name", externalAgentId)
      .maybeSingle();
    
    if (nameError) {
      logError(`Error looking up agent by name: ${nameError.message}`);
    }
    
    if (nameAgent) {
      logInfo(`Found agent by name: ${nameAgent.id}`);
      return nameAgent.id;
    }

    // Check if this is an organization's agent_id
    // This should be refactored if organizations.agent_id is changed to store UUIDs
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("agent_id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (orgError) {
      logError(`Error checking organization with agent_id: ${orgError.message}`);
    }
    
    if (organization) {
      // Try to find the agent referenced by the organization
      if (organization.agent_id && organization.agent_id !== externalAgentId) {
        // If agent_id is a UUID, use it directly
        const { data: orgAgent } = await supabase
          .from("agents")
          .select("id")
          .eq("id", organization.agent_id)
          .maybeSingle();
          
        if (orgAgent) {
          logInfo(`Found agent through organization reference: ${orgAgent.id}`);
          return orgAgent.id;
        }
      }
      
      // If we can't resolve to a specific agent, use the default agent
      const defaultAgentId = "2df8e9d7-0939-4bd8-9da1-c99ac86eb2f8";
      logInfo(`Using default agent ID for organization reference: ${defaultAgentId}`);
      return defaultAgentId;
    }
    
    logInfo(`Agent not found for external ID: ${externalAgentId}`);
    return null;
  } catch (error) {
    logError(`Unexpected error in getAgentUUIDByExternalId: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
