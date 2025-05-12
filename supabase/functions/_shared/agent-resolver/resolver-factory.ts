
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAgentUUIDByExternalId } from "./agent-lookup.ts";
import { checkUserOrganizationAccess } from "./access-control.ts";

/**
 * Create agent resolver functions
 * @param supabase Supabase client to use for database operations
 * @returns Object containing resolver functions
 */
export function createAgentResolver(supabase: SupabaseClient) {
  return {
    getAgentUUIDByExternalId: (externalAgentId: string) => 
      getAgentUUIDByExternalId(supabase, externalAgentId),
    checkUserOrganizationAccess: (userId: string, organizationId?: string, agentId?: string) => 
      checkUserOrganizationAccess(supabase, userId, organizationId, agentId)
  };
}
