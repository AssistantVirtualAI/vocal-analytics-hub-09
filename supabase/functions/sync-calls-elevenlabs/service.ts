
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Call, SyncResult } from "./models.ts";
import { findOrCreateAgent } from "./services/agent-service.ts";
import { syncCall } from "./services/call-processor.ts";

/**
 * Process multiple calls for synchronization
 */
export async function syncCalls(
  supabase: SupabaseClient,
  calls: Call[],
  agentId: string
): Promise<SyncResult[]> {
  const agentUUID = await findOrCreateAgent(supabase, agentId);
  const results: SyncResult[] = [];
  
  for (const call of calls) {
    const result = await syncCall(supabase, call, agentUUID);
    results.push(result);
  }
  
  return results;
}
