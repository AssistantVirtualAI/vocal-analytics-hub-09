
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HistoryItem } from "../_shared/elevenlabs/history-types.ts";
import { getAgentUUIDByExternalId } from "../_shared/agent-resolver-improved.ts";
import { SyncResult } from "./models.ts";
import { mapHistoryItemToCallData } from "./mapper.ts";

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
    console.log(`Syncing history item ${item.history_item_id}`);
    
    // Check if the call exists already
    const { data: existingCall, error: queryError } = await supabase
      .from("calls")
      .select("id")
      .eq("id", item.history_item_id)
      .maybeSingle();
    
    if (queryError) {
      console.error(`Error checking for existing call: ${queryError.message}`);
      throw queryError;
    }
    
    // Prepare the call data
    const callData = mapHistoryItemToCallData(item, agentId, supabaseUrl);
    
    if (existingCall) {
      console.log(`Call ${item.history_item_id} exists, updating`);
      // Update existing call
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
      // Insert new call
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
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log(`Creating Supabase client with URL: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Resolve the external agent ID (voice_id) to internal UUID
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
