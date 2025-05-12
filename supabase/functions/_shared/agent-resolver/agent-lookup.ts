
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
    
    // If not found, try to find by name/external_id
    const { data: agent, error: nameError } = await supabase
      .from("agents")
      .select("id")
      .eq("name", externalAgentId)
      .maybeSingle();
    
    if (nameError) {
      logError(`Error looking up agent by name: ${nameError.message}`);
    }
    
    if (agent) {
      logInfo(`Found agent by name/external_id: ${agent.id}`);
      return agent.id;
    }

    // If still not found, check organizations table for agent_id
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (orgError) {
      logError(`Error looking up organization by agent_id: ${orgError.message}`);
    }
    
    if (organization) {
      const defaultAgentId = "2df8e9d7-0939-4bd8-9da1-c99ac86eb2f8";
      logInfo(`Found organization with agent_id: ${externalAgentId}, using default agent: ${defaultAgentId}`);
      return defaultAgentId; // Use actual UUID instead of special flag
    }
    
    logInfo(`Agent not found for external ID: ${externalAgentId}`);
    return null;
  } catch (error) {
    logError(`Unexpected error in getAgentUUIDByExternalId: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
