
import { FormattedCall } from "./types.ts";
import { logInfo } from "../_shared/agent-resolver/logger.ts";

/**
 * Format calls data from database into normalized structure
 */
export function formatCallsResults(callsData: any[] | null, totalCount: number | null): { calls: FormattedCall[], totalCount: number | null } {
  logInfo(`Formatting ${callsData?.length || 0} calls. Total count: ${totalCount}`);
  
  const formattedCalls = callsData?.map(call => ({
    id: call.id,
    customer_id: call.customer_id || null,
    customer_name: call.customer_name || "Client inconnu",
    agent_id: call.agent_id || null, 
    agent_name: call.agent_name || "Agent inconnu",
    date: call.date || new Date().toISOString(),
    duration: call.duration || 0,
    satisfaction_score: call.satisfaction_score || 0,
    audio_url: call.audio_url || "",
    summary: call.summary || "",
    transcript: call.transcript || "",
    tags: call.tags || []
  })) || [];

  return { calls: formattedCalls, totalCount };
}
