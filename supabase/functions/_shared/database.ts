
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseEnvVars } from "./env.ts";

/**
 * Creates a Supabase client with service role permissions
 * @returns Supabase client instance
 */
export function createServiceClient(): SupabaseClient {
  const { supabaseUrl, supabaseServiceKey } = getSupabaseEnvVars();
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Recherche l'UUID d'un agent par son ID externe (ID ElevenLabs ou autre)
 */
export async function getAgentUUIDByExternalId(
  supabase: SupabaseClient,
  externalAgentId: string
): Promise<string | null> {
  if (!externalAgentId) return null;
  
  console.log(`[agent-resolver] Looking up agent with ID matching: ${externalAgentId}`);
  
  // Essai d'identification directe (si c'est déjà un UUID)
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
    // Attendu si l'ID n'est pas un UUID, continuez avec l'approche suivante
  }
  
  // Recherche par nom d'agent
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
  } catch (err) {
    console.log(`[agent-resolver] Name lookup failed: ${err}`);
  }
  
  // Recherche par agent_id dans la table des organisations
  try {
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (!orgError && orgData) {
      console.log(`[agent-resolver] Found organization with agent_id: ${externalAgentId}, using special flag`);
      return "USE_NO_FILTER";
    }
  } catch (err) {
    console.log(`[agent-resolver] Organization lookup failed: ${err}`);
  }
  
  console.warn(`[agent-resolver] No agent found with ID or name matching: ${externalAgentId}`);
  return null;
}
