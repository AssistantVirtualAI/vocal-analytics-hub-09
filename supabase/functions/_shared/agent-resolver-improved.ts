
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Version améliorée de la résolution d'identifiant d'agent
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
    const { data, error } = await supabase
      .from("agents")
      .select("id, name, external_id")
      .eq("external_id", externalAgentId)
      .maybeSingle();
      
    if (!error && data) {
      console.log(`[agent-resolver] Found agent with external_id match: ${data.id} (${data.name})`);
      return data.id;
    }
  } catch (err) {
    console.log(`[agent-resolver] External ID lookup failed: ${err}`);
  }
  
  // Then try looking up by the ID directly
  if (isUuid) {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("id")
        .eq("id", externalAgentId)
        .maybeSingle();
        
      if (!error && data) {
        console.log(`[agent-resolver] Found agent directly with ID: ${data.id}`);
        return data.id;
      }
    } catch (err) {
      console.log(`[agent-resolver] Direct ID lookup failed: ${err}`);
    }
  }
  
  // Try by name
  try {
    const { data, error } = await supabase
      .from("agents")
      .select("id, name")
      .eq("name", externalAgentId)
      .maybeSingle();

    if (!error && data) {
      console.log(`[agent-resolver] Found agent by name: ${data.id} (${data.name})`);
      return data.id;
    }
  } catch (err) {
    console.log(`[agent-resolver] Name lookup failed: ${err}`);
  }
  
  // Try finding by agent_id in the organizations table
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, agent_id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (!error && data) {
      console.log(`[agent-resolver] Found organization '${data.name}' with agent_id: ${externalAgentId}, using special flag`);
      return "USE_NO_FILTER";
    }
  } catch (err) {
    console.log(`[agent-resolver] Organization lookup failed: ${err}`);
  }
  
  console.warn(`[agent-resolver] No agent found with ID or name matching: ${externalAgentId}`);
  
  // Option to create agent automatically if needed
  try {
    // Vérifier si c'est probablement un ID ElevenLabs (format spécifique)
    const isElevenLabsId = /^[A-Za-z0-9]{20,25}$/.test(externalAgentId);
    
    if (isElevenLabsId) {
      console.log(`[agent-resolver] ID ${externalAgentId} looks like an ElevenLabs ID, attempting to create agent`);
      
      const { data: newAgent, error } = await supabase
        .from("agents")
        .insert({
          name: `ElevenLabs Agent (${externalAgentId.substring(0, 8)}...)`,
          external_id: externalAgentId,
          provider: "elevenlabs",
          status: "active"
        })
        .select("id")
        .single();
        
      if (!error && newAgent) {
        console.log(`[agent-resolver] Created new agent with ID: ${newAgent.id}`);
        return newAgent.id;
      } else {
        console.error(`[agent-resolver] Failed to create agent: ${error?.message || "Unknown error"}`);
      }
    }
  } catch (createErr) {
    console.error(`[agent-resolver] Failed to create agent: ${createErr}`);
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
