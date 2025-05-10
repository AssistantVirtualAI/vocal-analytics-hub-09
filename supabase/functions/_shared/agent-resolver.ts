
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Résout l'identifiant d'agent à partir de diverses sources
 * @param supabase Client Supabase
 * @param externalAgentId Identifiant externe de l'agent
 * @returns UUID d'agent ou valeur spéciale
 */
export async function getAgentUUIDByExternalId(supabase: SupabaseClient, externalAgentId: string): Promise<string | null> {
  if (!externalAgentId) return null;
  
  console.log(`[agent-resolver] Looking up agent with ID matching: ${externalAgentId}`);
  
  // First try looking up by the ID directly in the agents table (in case it's already a UUID)
  try {
    const { data: directData, error: directError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", externalAgentId)
      .maybeSingle();
      
    if (!directError && directData) {
      console.log(`[agent-resolver] Found agent directly with ID: ${directData.id}`);
      return directData.id;
    }
  } catch (err) {
    console.log(`[agent-resolver] Direct ID lookup failed, will try alternative lookups: ${err}`);
    // This is expected if the ID is not a UUID, continue to next approach
  }
  
  // Try looking up the agent by name in the agents table
  try {
    const { data: nameData, error: nameError } = await supabase
      .from("agents")
      .select("id")
      .eq("name", externalAgentId)
      .maybeSingle();

    if (!nameError && nameData) {
      console.log(`[agent-resolver] Found agent by name: ${nameData.id}`);
      return nameData.id;
    }
    
    if (nameError) {
      console.log(`[agent-resolver] Error fetching agent by name: ${nameError.message || JSON.stringify(nameError)}`);
    }
  } catch (err) {
    console.log(`[agent-resolver] Name lookup failed: ${err}`);
    // Continue to next approach
  }
  
  // Try finding by agent_id in the organizations table
  try {
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (!orgError && orgData) {
      console.log(`[agent-resolver] Found organization with agent_id: ${externalAgentId}, using special flag`);
      // This is a special case - return a non-null value to indicate we should proceed with query
      // but without a specific agent filter
      return "USE_NO_FILTER";
    }
    
    if (orgError) {
      console.log(`[agent-resolver] Error checking organization table: ${orgError.message || JSON.stringify(orgError)}`);
    }
  } catch (err) {
    console.log(`[agent-resolver] Organization lookup failed: ${err}`);
  }
  
  console.warn(`[agent-resolver] No agent found with ID or name matching: ${externalAgentId}`);
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
    throw new Error('Missing required Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}
