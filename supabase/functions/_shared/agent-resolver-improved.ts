
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Version améliorée de la résolution d'identifiant d'agent
 * avec meilleure gestion des erreurs et journalisation
 */
export async function getAgentUUIDByExternalId(supabase: SupabaseClient, externalAgentId: string): Promise<string | null> {
  if (!externalAgentId) {
    console.warn("[agent-resolver] External agent ID is empty or null");
    return null;
  }
  
  console.log(`[agent-resolver] Looking up agent with ID matching: ${externalAgentId}`);
  
  // Vérifier si c'est un UUID valide
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(externalAgentId);
  console.log(`[agent-resolver] Provided ID is ${isUuid ? 'a valid UUID' : 'not a UUID format'}`);
  
  // First try looking up by the external_id in the agents table
  try {
    console.log(`[agent-resolver] Searching by external_id: ${externalAgentId}`);
    const { data, error } = await supabase
      .from("agents")
      .select("id, name, external_id")
      .eq("external_id", externalAgentId)
      .maybeSingle();
      
    if (error) {
      console.error(`[agent-resolver] Error searching by external_id: ${error.message}`);
    } else if (data) {
      console.log(`[agent-resolver] Found agent with external_id match: ${data.id} (${data.name})`);
      return data.id;
    } else {
      console.log(`[agent-resolver] No agent found with external_id: ${externalAgentId}`);
    }
  } catch (err) {
    console.error(`[agent-resolver] External ID lookup failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  // Then try looking up by the ID directly if it's a valid UUID
  if (isUuid) {
    try {
      console.log(`[agent-resolver] Searching by direct UUID: ${externalAgentId}`);
      const { data, error } = await supabase
        .from("agents")
        .select("id, name")
        .eq("id", externalAgentId)
        .maybeSingle();
        
      if (error) {
        console.error(`[agent-resolver] Error searching by direct ID: ${error.message}`);
      } else if (data) {
        console.log(`[agent-resolver] Found agent directly with ID: ${data.id}${data.name ? ` (${data.name})` : ''}`);
        return data.id;
      } else {
        console.log(`[agent-resolver] No agent found with direct ID: ${externalAgentId}`);
      }
    } catch (err) {
      console.error(`[agent-resolver] Direct ID lookup failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  // Try by name
  try {
    console.log(`[agent-resolver] Searching by agent name: ${externalAgentId}`);
    const { data, error } = await supabase
      .from("agents")
      .select("id, name")
      .eq("name", externalAgentId)
      .maybeSingle();

    if (error) {
      console.error(`[agent-resolver] Error searching by name: ${error.message}`);
    } else if (data) {
      console.log(`[agent-resolver] Found agent by name: ${data.id} (${data.name})`);
      return data.id;
    } else {
      console.log(`[agent-resolver] No agent found with name: ${externalAgentId}`);
    }
  } catch (err) {
    console.error(`[agent-resolver] Name lookup failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  // Try finding by agent_id in the organizations table
  try {
    console.log(`[agent-resolver] Searching in organizations table for agent_id: ${externalAgentId}`);
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, agent_id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (error) {
      console.error(`[agent-resolver] Error searching in organizations: ${error.message}`);
    } else if (data) {
      console.log(`[agent-resolver] Found organization '${data.name}' with agent_id: ${externalAgentId}, using special flag`);
      return "USE_NO_FILTER";
    } else {
      console.log(`[agent-resolver] No organization found with agent_id: ${externalAgentId}`);
    }
  } catch (err) {
    console.error(`[agent-resolver] Organization lookup failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  console.warn(`[agent-resolver] No agent found with ID or name matching: ${externalAgentId}`);
  
  // Option to create agent automatically if needed
  try {
    // Identifier patterns
    const isElevenLabsId = /^[A-Za-z0-9]{20,25}$/.test(externalAgentId);
    const isElevenLabsShortId = !isElevenLabsId && /^[A-Za-z0-9]{8,19}$/.test(externalAgentId);
    
    if (isElevenLabsId || isElevenLabsShortId) {
      console.log(`[agent-resolver] ID ${externalAgentId} looks like an ElevenLabs ID (format: ${isElevenLabsId ? 'standard' : 'short'}), attempting to create agent`);
      
      // Generate a more descriptive name based on the ID format
      const agentName = isElevenLabsId 
        ? `ElevenLabs Agent (${externalAgentId.substring(0, 8)}...)`
        : `ElevenLabs Agent (${externalAgentId})`;
      
      console.log(`[agent-resolver] Creating new agent with name: ${agentName}`);
      const { data: newAgent, error } = await supabase
        .from("agents")
        .insert({
          name: agentName,
          external_id: externalAgentId,
          provider: "elevenlabs",
          status: "active",
          role: "voice" // Adding a default role for better categorization
        })
        .select("id, name")
        .single();
        
      if (error) {
        console.error(`[agent-resolver] Failed to create agent: ${error.message}`);
        if (error.code === '23505') { // Unique constraint violation
          console.log(`[agent-resolver] Agent with this external_id might already exist, trying to fetch again`);
          // Try one more lookup by external_id in case of a race condition
          const { data: existingAgent } = await supabase
            .from("agents")
            .select("id")
            .eq("external_id", externalAgentId)
            .maybeSingle();
            
          if (existingAgent) {
            console.log(`[agent-resolver] Found existing agent after creation attempt: ${existingAgent.id}`);
            return existingAgent.id;
          }
        }
      } else if (newAgent) {
        console.log(`[agent-resolver] Created new agent with ID: ${newAgent.id} (${newAgent.name})`);
        
        // Update sync status to indicate new agent creation
        try {
          await supabase
            .from("sync_status")
            .insert({
              provider: "elevenlabs",
              status: "pending",
              last_sync_date: new Date().toISOString()
            })
            .select("id")
            .single();
          console.log(`[agent-resolver] Created new sync status entry for the new agent`);
        } catch (syncErr) {
          console.warn(`[agent-resolver] Could not create sync status entry: ${syncErr instanceof Error ? syncErr.message : String(syncErr)}`);
        }
        
        return newAgent.id;
      }
    } else {
      console.log(`[agent-resolver] ID ${externalAgentId} does not match any known format for auto-creation`);
    }
  } catch (createErr) {
    console.error(`[agent-resolver] Failed to create agent: ${createErr instanceof Error ? createErr.message : String(createErr)}`);
  }
  
  return null;
}

/**
 * Crée un client Supabase à partir des variables d'environnement
 * @returns Client Supabase avec les privilèges de service
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('[agent-resolver] Missing required Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Vérifie si un agent existe et le crée s'il n'existe pas
 * @param supabase Client Supabase
 * @param externalId Identifiant externe de l'agent
 * @param name Nom de l'agent (optionnel)
 * @returns L'UUID de l'agent
 */
export async function getOrCreateAgent(
  supabase: SupabaseClient,
  externalId: string,
  name?: string
): Promise<string | null> {
  try {
    // Essayer de résoudre l'agent d'abord
    const agentId = await getAgentUUIDByExternalId(supabase, externalId);
    if (agentId && agentId !== "USE_NO_FILTER") {
      return agentId;
    }
    
    // Si on n'a pas trouvé d'agent et qu'on a un nom, on crée un nouvel agent
    if (!agentId && name) {
      console.log(`[agent-resolver] Creating new agent with name: ${name} and externalId: ${externalId}`);
      
      const { data: newAgent, error } = await supabase
        .from("agents")
        .insert({
          name: name,
          external_id: externalId,
          provider: "elevenlabs",
          status: "active"
        })
        .select("id")
        .single();
        
      if (error) {
        console.error(`[agent-resolver] Failed to create agent with name: ${error.message}`);
        return null;
      }
      
      console.log(`[agent-resolver] Successfully created new agent: ${newAgent.id}`);
      return newAgent.id;
    }
    
    return agentId === "USE_NO_FILTER" ? null : agentId;
  } catch (error) {
    console.error(`[agent-resolver] Error in getOrCreateAgent: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
