
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId } from "../../_shared/agent-resolver-improved.ts";

/**
 * Find or create an agent by name or ID
 */
export async function findOrCreateAgent(
  supabase: SupabaseClient,
  agentId: string
): Promise<string> {
  // First try to resolve using the shared resolver
  const agentUUID = await getAgentUUIDByExternalId(supabase, agentId);
  
  if (agentUUID) {
    console.log(`Found existing agent with UUID: ${agentUUID}`);
    return agentUUID;
  }
  
  // If not found, create a new agent
  console.log(`No agent found for ID: ${agentId}, creating one`);
  
  // Create a new agent
  const { data: newAgent, error: createError } = await supabase
    .from("agents")
    .insert({
      name: agentId,
      external_id: agentId,
      role: "assistant"
    })
    .select("id")
    .single();
  
  if (createError) {
    console.error("Error creating agent:", createError);
    throw new Error(`Failed to create agent: ${createError.message}`);
  }
  
  console.log(`Created new agent with UUID: ${newAgent.id}`);
  return newAgent.id;
}
