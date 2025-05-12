
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  HistoryItem, 
  ElevenLabsHistoryResponse, 
  CallData, 
  SyncResult 
} from "./models.ts";
import { fetchElevenLabsHistory, fetchElevenLabsHistoryItem } from "../_shared/elevenlabs/history.ts";
import { getAgentUUIDByExternalId } from "../_shared/agent-resolver-improved.ts";

/**
 * Convertit un élément d'historique en données d'appel pour la base de données
 */
export function mapHistoryItemToCallData(
  item: HistoryItem, 
  agentId: string,
  supabaseUrl?: string
): CallData {
  console.log(`Mapping history item ${item.history_item_id} to call data`);
  
  // Construct the proxy audio URL that points to our edge function
  const audioUrl = supabaseUrl 
    ? `${supabaseUrl}/functions/v1/get-call-audio?history_id=${item.history_item_id}`
    : `https://api.elevenlabs.io/v1/history/${item.history_item_id}/audio`;
  
  return {
    id: item.history_item_id,
    audio_url: audioUrl,
    agent_id: agentId, // This should be the internal UUID
    date: new Date(item.created_at || (item.date_unix ? item.date_unix * 1000 : Date.now())).toISOString(),
    customer_id: null,
    customer_name: "Client inconnu",
    satisfaction_score: 0,
    duration: 0,
    transcript: item.text || "",
    elevenlabs_history_item_id: item.history_item_id // Store the original history item ID
  };
}

/**
 * Synchronise un élément d'historique avec la base de données
 */
export async function syncHistoryItem(
  supabase: SupabaseClient,
  item: HistoryItem,
  agentId: string,
  supabaseUrl?: string
): Promise<SyncResult> {
  try {
    console.log(`Syncing history item ${item.history_item_id}`);
    
    // Vérifier si l'appel existe déjà
    const { data: existingCall, error: queryError } = await supabase
      .from("calls")
      .select("id")
      .eq("id", item.history_item_id)
      .maybeSingle();
    
    if (queryError) {
      console.error(`Error checking for existing call: ${queryError.message}`);
      throw queryError;
    }
    
    // Préparer les données de l'appel
    const callData = mapHistoryItemToCallData(item, agentId, supabaseUrl);
    
    if (existingCall) {
      console.log(`Call ${item.history_item_id} exists, updating`);
      // Mettre à jour l'appel existant
      const { error } = await supabase
        .from("calls")
        .update(callData)
        .eq("id", item.history_item_id);
      
      if (error) {
        console.error(`Error updating call: ${error.message}`);
        throw error;
      }
      
      return { id: item.history_item_id, success: true, action: "updated" };
    } else {
      console.log(`Call ${item.history_item_id} does not exist, creating`);
      // Insérer un nouvel appel
      const { error } = await supabase
        .from("calls")
        .insert(callData);
      
      if (error) {
        console.error(`Error inserting call: ${error.message}`);
        throw error;
      }
      
      return { id: item.history_item_id, success: true, action: "created" };
    }
  } catch (error) {
    console.error(`Error syncing history item ${item.history_item_id}:`, error);
    return { 
      id: item.history_item_id, 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Synchronise plusieurs éléments d'historique avec la base de données
 */
export async function syncHistoryItems(
  supabaseUrl: string, 
  supabaseServiceKey: string,
  historyItems: HistoryItem[],
  externalAgentId: string
): Promise<SyncResult[]> {
  // Vérifier que les variables nécessaires sont présentes
  if (!supabaseUrl || !supabaseServiceKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log(`Creating Supabase client with URL: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // IMPROVED: Resolve the external agent ID (voice_id) to internal UUID
  console.log(`Looking up internal UUID for external agent ID: ${externalAgentId}`);
  let internalAgentId = await getAgentUUIDByExternalId(supabase, externalAgentId);
  
  // If no agent is found, create one
  if (!internalAgentId) {
    console.log(`No agent found for external ID: ${externalAgentId}, creating one`);
    try {
      // Create a new agent with the external ID as the name and external_id
      const { data: newAgent, error } = await supabase
        .from("agents")
        .insert({
          name: externalAgentId,
          external_id: externalAgentId,
          role: "assistant",
          provider: "elevenlabs"
        })
        .select("id")
        .single();
      
      if (error) {
        console.error(`Error creating new agent: ${error.message}`);
        throw error;
      }
      
      internalAgentId = newAgent.id;
      console.log(`Created new agent with internal UUID: ${internalAgentId}`);
    } catch (error) {
      console.error(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  } else {
    console.log(`Found internal agent UUID: ${internalAgentId} for external ID: ${externalAgentId}`);
  }
  
  if (!internalAgentId) {
    throw new Error(`Could not determine internal agent ID for external ID: ${externalAgentId}`);
  }
  
  console.log(`Starting sync of ${historyItems.length} history items for agent ${internalAgentId}`);
  const results: SyncResult[] = [];
  
  for (const item of historyItems) {
    const result = await syncHistoryItem(supabase, item, internalAgentId, supabaseUrl);
    results.push(result);
  }
  
  return results;
}
