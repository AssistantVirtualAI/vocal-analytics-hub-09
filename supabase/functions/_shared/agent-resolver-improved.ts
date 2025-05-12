
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isUUID } from "https://deno.land/std@0.167.0/uuid/mod.ts";

/**
 * Creates service client for working with Supabase
 */
export function createServiceClient(supabaseUrl: string, supabaseServiceKey: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Creates a set of agent resolver functions
 */
export function createAgentResolver(supabase: SupabaseClient) {
  /**
   * Gets an agent UUID by its external ID or confirms UUID is valid
   */
  async function getAgentUUIDByExternalId(externalId: string): Promise<string | null> {
    // If it's already a UUID, verify it exists and return it
    if (isUUID(externalId)) {
      console.log(`[getAgentUUIDByExternalId] Input appears to be a valid UUID: ${externalId}`);
      
      // Double-check that this UUID exists in the database
      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .eq('id', externalId)
        .single();
      
      if (error) {
        console.error(`[getAgentUUIDByExternalId] Error confirming UUID exists: ${error.message}`);
      }
      
      if (data) {
        console.log(`[getAgentUUIDByExternalId] Confirmed existing UUID: ${externalId}`);
        return externalId;
      } else {
        console.log(`[getAgentUUIDByExternalId] UUID not found in database: ${externalId}`);
      }
    }
    
    // Try to look up by external_id
    console.log(`[getAgentUUIDByExternalId] Looking up agent by external_id: ${externalId}`);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .eq('external_id', externalId)
        .single();
      
      if (error) {
        console.error(`[getAgentUUIDByExternalId] Error finding by external_id: ${error.message}`);
        return null;
      }
      
      console.log(`[getAgentUUIDByExternalId] Found agent UUID ${data?.id} for external ID ${externalId}`);
      return data?.id || null;
      
    } catch (error) {
      console.error(`[getAgentUUIDByExternalId] Exception looking up agent: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  return {
    getAgentUUIDByExternalId,
  };
}
