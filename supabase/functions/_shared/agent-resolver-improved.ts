
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Creates an agent resolver factory that can be reused across functions
 */
export function createAgentResolver(supabase: SupabaseClient) {
  /**
   * Get a UUID for an agent by external ID
   */
  const getAgentUUIDByExternalId = async (externalId: string): Promise<string | null> => {
    console.log(`Looking up agent with external_id matching: ${externalId}`);
    
    // First, check if the ID is already a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(externalId)) {
      console.log(`Found agent directly with ID: ${externalId}`);
      return externalId;
    }
    
    // Otherwise, look it up in the agents table
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id')
      .eq('external_id', externalId)
      .limit(1);
    
    if (error) {
      console.error(`Error looking up agent by external_id: ${error.message}`);
      return null;
    }
    
    if (agents && agents.length > 0) {
      console.log(`Found agent with external_id ${externalId}: ${agents[0].id}`);
      return agents[0].id;
    }
    
    // If not found by external_id, check if it's an organization's agent_id
    // and return a special value to indicate we should not filter by agent
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('agent_id', externalId)
      .limit(1);
      
    if (orgError) {
      console.error(`Error checking for organization: ${orgError.message}`);
    } else if (orgs && orgs.length > 0) {
      console.log(`Found organization with agent_id ${externalId}, using no agent filter`);
      return 'USE_NO_FILTER';
    }
    
    console.log(`No agent found with external_id: ${externalId}`);
    return null;
  };
  
  /**
   * Get an agent ID from an organization slug
   */
  const getAgentIdFromOrgSlug = async (slug: string): Promise<string | null> => {
    console.log(`Looking up agent_id for org with slug: ${slug}`);
    
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('agent_id')
      .eq('slug', slug)
      .limit(1);
    
    if (error) {
      console.error(`Error looking up org by slug: ${error.message}`);
      return null;
    }
    
    if (orgs && orgs.length > 0) {
      console.log(`Found organization with slug ${slug}, agent_id: ${orgs[0].agent_id}`);
      return orgs[0].agent_id;
    }
    
    console.log(`No organization found with slug: ${slug}`);
    return null;
  };
  
  return {
    getAgentUUIDByExternalId,
    getAgentIdFromOrgSlug
  };
}

/**
 * Creates a Supabase client for service role operations
 */
export function createServiceClient(supabaseUrl: string, supabaseServiceKey: string) {
  return createClient(supabaseUrl, supabaseServiceKey);
}
