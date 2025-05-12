
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo, logError } from "./logger.ts";

/**
 * Recherche l'UUID d'un agent par son ID externe (ID ElevenLabs ou autre)
 */
export async function getAgentUUIDByExternalId(
  supabase: SupabaseClient,
  externalAgentId: string
): Promise<string | null> {
  if (!externalAgentId) return null;
  
  logInfo(`Looking up agent with ID matching: ${externalAgentId}`);
  
  // Essai d'identification directe (si c'est déjà un UUID)
  try {
    const { data: directData, error: directError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", externalAgentId)
      .maybeSingle();
      
    if (!directError && directData) {
      logInfo(`Found agent directly with ID: ${directData.id}`);
      return directData.id;
    }
  } catch (err) {
    logInfo(`Direct ID lookup failed, will try alternative lookups: ${err}`);
    // Attendu si l'ID n'est pas un UUID, continuez avec l'approche suivante
  }
  
  // Recherche par external_id (nouveau champ pour elevenlabs_voice_id)
  try {
    const { data: externalIdData, error: externalIdError } = await supabase
      .from("agents")
      .select("id")
      .eq("external_id", externalAgentId)
      .maybeSingle();

    if (!externalIdError && externalIdData) {
      logInfo(`Found agent by external_id: ${externalIdData.id}`);
      return externalIdData.id;
    }
  } catch (err) {
    logInfo(`External ID lookup failed: ${err}`);
  }
  
  // Recherche par nom d'agent
  try {
    const { data: nameData, error: nameError } = await supabase
      .from("agents")
      .select("id")
      .eq("name", externalAgentId)
      .maybeSingle();

    if (!nameError && nameData) {
      logInfo(`Found agent by name: ${nameData.id}`);
      return nameData.id;
    }
  } catch (err) {
    logInfo(`Name lookup failed: ${err}`);
  }
  
  // Recherche par agent_id dans la table des organisations
  try {
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("agent_id")
      .eq("agent_id", externalAgentId)
      .maybeSingle();
    
    if (!orgError && orgData && orgData.agent_id) {
      logInfo(`Found organization with agent_id: ${orgData.agent_id}`);
      return orgData.agent_id;
    }
  } catch (err) {
    logInfo(`Organization lookup failed: ${err}`);
  }
  
  logError(`No agent found with ID, external_id, or name matching: ${externalAgentId}`);
  return null;
}
