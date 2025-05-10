
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  HistoryItem, 
  ElevenLabsHistoryResponse, 
  CallData, 
  SyncResult 
} from "./models.ts";

/**
 * Récupère l'historique des appels depuis l'API ElevenLabs
 */
export async function fetchElevenLabsHistory(
  apiKey: string,
  agentId: string
): Promise<HistoryItem[]> {
  console.log(`Fetching history for agent ID: ${agentId}`);
  
  const historyResponse = await fetch("https://api.elevenlabs.io/v1/history", {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "xi-api-key": apiKey,
    }
  });

  if (!historyResponse.ok) {
    const errorData = await historyResponse.json();
    console.error("ElevenLabs API Error:", historyResponse.status, errorData);
    throw new Error(`Failed to fetch history from ElevenLabs: ${errorData.detail || historyResponse.statusText}`);
  }

  const historyData = await historyResponse.json() as ElevenLabsHistoryResponse;
  
  // Filtrer les éléments qui correspondent à l'agent ID
  const agentHistory = historyData.history.filter(item => 
    item.voice_id === agentId || 
    item.model_id === agentId
  );

  console.log(`Found ${agentHistory.length} history items for agent ID: ${agentId}`);
  
  return agentHistory;
}

/**
 * Convertit un élément d'historique en données d'appel pour la base de données
 */
export function mapHistoryItemToCallData(
  item: HistoryItem, 
  agentId: string
): CallData {
  return {
    id: item.history_item_id,
    audio_url: `https://api.elevenlabs.io/v1/history/${item.history_item_id}/audio`,
    agent_id: agentId,
    date: new Date(item.created_at || (item.date_unix ? item.date_unix * 1000 : Date.now())).toISOString(),
    customer_id: null,
    customer_name: "Client inconnu",
    satisfaction_score: 0,
    duration: 0,
    transcript: item.text || "",
  };
}

/**
 * Synchronise un élément d'historique avec la base de données
 */
export async function syncHistoryItem(
  supabase: SupabaseClient,
  item: HistoryItem,
  agentId: string
): Promise<SyncResult> {
  try {
    // Vérifier si l'appel existe déjà
    const { data: existingCall } = await supabase
      .from("calls")
      .select("id")
      .eq("id", item.history_item_id)
      .maybeSingle();
    
    // Préparer les données de l'appel
    const callData = mapHistoryItemToCallData(item, agentId);
    
    if (existingCall) {
      // Mettre à jour l'appel existant
      const { error } = await supabase
        .from("calls")
        .update(callData)
        .eq("id", item.history_item_id);
      
      if (error) {
        throw error;
      }
      
      return { id: item.history_item_id, success: true, action: "updated" };
    } else {
      // Insérer un nouvel appel
      const { error } = await supabase
        .from("calls")
        .insert(callData);
      
      if (error) {
        throw error;
      }
      
      return { id: item.history_item_id, success: true, action: "created" };
    }
  } catch (error) {
    console.error(`Error syncing history item ${item.history_item_id}:`, error);
    return { 
      id: item.history_item_id, 
      success: false, 
      error: error.message || "Unknown error"
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
  agentId: string
): Promise<SyncResult[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const results: SyncResult[] = [];
  
  for (const item of historyItems) {
    const result = await syncHistoryItem(supabase, item, agentId);
    results.push(result);
  }
  
  return results;
}
