
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HistoryItem } from "../_shared/elevenlabs/history-types.ts";
import { getAgentUUIDByExternalId } from "../_shared/agent-resolver/index.ts";
import { SyncResult } from "./models.ts";
import { mapHistoryItemToCallData } from "./mapper.ts";
import { logInfo, logError } from "../_shared/agent-resolver/logger.ts";

/**
 * Synchronize a history item with the database
 */
export async function syncHistoryItem(
  supabase: SupabaseClient,
  item: HistoryItem,
  agentId: string,
  supabaseUrl?: string
): Promise<SyncResult> {
  try {
    logInfo(`Syncing history item ${item.history_item_id}`);
    
    // Check if the call exists already by both ID and elevenlabs_history_item_id
    const { data: existingCall, error: queryError } = await supabase
      .from("calls")
      .select("id")
      .or(`id.eq.${item.history_item_id},elevenlabs_history_item_id.eq.${item.history_item_id}`)
      .maybeSingle();
    
    if (queryError) {
      logError(`Error checking for existing call: ${queryError.message}`);
      throw queryError;
    }
    
    // Prepare the call data
    const callData = mapHistoryItemToCallData(item, agentId, supabaseUrl);
    
    if (existingCall) {
      logInfo(`Call ${item.history_item_id} exists, updating`);
      // Update existing call
      const { error } = await supabase
        .from("calls")
        .update(callData)
        .eq("id", existingCall.id);
      
      if (error) {
        logError(`Error updating call: ${error.message}`);
        throw error;
      }
      
      return { id: item.history_item_id, success: true, action: "updated" };
    } else {
      logInfo(`Call ${item.history_item_id} does not exist, creating`);
      // Insert new call
      const { error } = await supabase
        .from("calls")
        .insert(callData);
      
      if (error) {
        logError(`Error inserting call: ${error.message}`);
        throw error;
      }
      
      return { id: item.history_item_id, success: true, action: "created" };
    }
  } catch (error) {
    logError(`Error syncing history item ${item.history_item_id}:`, error);
    return { 
      id: item.history_item_id, 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Synchronize multiple history items with the database
 */
export async function syncHistoryItems(
  supabaseUrl: string, 
  supabaseServiceKey: string,
  historyItems: HistoryItem[],
  externalAgentId: string
): Promise<SyncResult[]> {
  // Check required environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
    logError(errorMsg);
    throw new Error(errorMsg);
  }
  
  logInfo(`Creating Supabase client with URL: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Resolve the external agent ID (voice_id) to internal UUID
  logInfo(`Looking up internal UUID for external agent ID: ${externalAgentId}`);
  let internalAgentId = await getAgentUUIDByExternalId(supabase, externalAgentId);
  
  // If no agent is found, create one
  if (!internalAgentId) {
    logInfo(`No agent found for external ID: ${externalAgentId}, creating one`);
    try {
      // Create a new agent with the external ID as both name and external_id
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
        logError(`Error creating new agent: ${error.message}`);
        throw error;
      }
      
      internalAgentId = newAgent.id;
      logInfo(`Created new agent with internal UUID: ${internalAgentId}`);
    } catch (error) {
      logError(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  } else {
    logInfo(`Found internal agent UUID: ${internalAgentId} for external ID: ${externalAgentId}`);
  }
  
  if (!internalAgentId) {
    throw new Error(`Could not determine internal agent ID for external ID: ${externalAgentId}`);
  }
  
  logInfo(`Starting sync of ${historyItems.length} history items for agent ${internalAgentId}`);
  const results: SyncResult[] = [];
  
  for (const item of historyItems) {
    const result = await syncHistoryItem(supabase, item, internalAgentId, supabaseUrl);
    results.push(result);
  }
  
  return results;
}
