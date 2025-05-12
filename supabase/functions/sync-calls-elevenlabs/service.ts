
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Call, CallData, SyncResult } from "./models.ts";
import { formatDate, parseDuration } from "./utils.ts";
import { getAgentUUIDByExternalId } from "../_shared/agent-resolver-improved.ts";

/**
 * Process a call and prepare it for database storage
 */
export function prepareSyncCall(
  call: Call,
  agentUUID: string,
): CallData {
  const conversationId = call.id || call.conversationId;
  const date = formatDate(call.date);
  const duration = parseDuration(call.duration || "0");
  const audioUrl = call.audioUrl || "";
  const transcript = call.transcript || "";
  const summary = call.summary || "";
  
  // Generate a satisfaction score based on the evaluation result if available
  let satisfactionScore = 0;
  if (call.evaluationResult && call.evaluationResult.toLowerCase() === "successful") {
    // Random satisfaction score between 4-5 for successful calls
    satisfactionScore = Math.floor(Math.random() * 2) + 4;
  } else if (call.evaluationResult) {
    // Random satisfaction score between 1-3 for other calls
    satisfactionScore = Math.floor(Math.random() * 3) + 1;
  }

  return {
    id: conversationId,
    duration,
    satisfaction_score: satisfactionScore,
    date,
    audio_url: audioUrl,
    transcript,
    summary,
    agent_id: agentUUID,
    customer_id: "", // Will be populated later
  };
}

/**
 * Find or create a customer by name
 */
export async function findOrCreateCustomer(
  supabase: SupabaseClient,
  customerName: string
): Promise<string> {
  // Check if customer exists with this name
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("name", customerName)
    .maybeSingle();
  
  if (existingCustomer) {
    return existingCustomer.id;
  }
  
  // Create new customer
  const { data: newCustomer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: customerName
    })
    .select("id")
    .single();
  
  if (customerError) {
    console.error("Error creating customer:", customerError);
    throw new Error(`Failed to create customer: ${customerError.message}`);
  }
  
  return newCustomer.id;
}

/**
 * Update or create a call in the database
 */
export async function syncCall(
  supabase: SupabaseClient,
  call: Call,
  agentUUID: string
): Promise<SyncResult> {
  try {
    const callData = prepareSyncCall(call, agentUUID);
    const conversationId = call.id || call.conversationId || "";
    
    // Check if call already exists
    const { data: existingCall } = await supabase
      .from("calls")
      .select("id")
      .eq("id", conversationId)
      .maybeSingle();
    
    if (existingCall) {
      // Update existing call
      console.log(`Updating existing call with ID: ${conversationId}`);
      const { error } = await supabase
        .from("calls")
        .update({
          duration: callData.duration,
          satisfaction_score: callData.satisfaction_score,
          date: callData.date,
          audio_url: callData.audio_url,
          transcript: callData.transcript,
          summary: callData.summary
        })
        .eq("id", conversationId);
      
      if (error) {
        console.error(`Error updating call ${conversationId}:`, error);
        return { id: conversationId, success: false, error: error.message };
      }
      
      return { id: conversationId, success: true, action: "updated" };
    } else {
      // Find or create customer
      const customerId = await findOrCreateCustomer(supabase, call.customerName || "Unknown Customer");
      
      // Insert new call
      console.log(`Creating new call with ID: ${conversationId}`);
      const { error } = await supabase
        .from("calls")
        .insert({
          id: conversationId,
          duration: callData.duration,
          satisfaction_score: callData.satisfaction_score,
          date: callData.date,
          audio_url: callData.audio_url,
          transcript: callData.transcript,
          summary: callData.summary,
          agent_id: agentUUID,
          customer_id: customerId,
        });
      
      if (error) {
        console.error(`Error creating call ${conversationId}:`, error);
        return { id: conversationId, success: false, error: error.message };
      }
      
      return { id: conversationId, success: true, action: "created" };
    }
  } catch (callError) {
    console.error("Error processing call:", callError);
    return { 
      id: call.id || "unknown", 
      success: false, 
      error: callError instanceof Error ? callError.message : "Unknown error" 
    };
  }
}

/**
 * Find or create an agent by name or ID
 */
export async function findOrCreateAgent(
  supabase: SupabaseClient,
  agentId: string
): Promise<string> {
  // First try to resolve using the shared resolver
  const agentUUID = await getAgentUUIDByExternalId(supabase, agentId);
  
  if (agentUUID) {
    console.log(`Found existing agent with UUID: ${agentUUID}`);
    return agentUUID;
  }
  
  // If not found, create a new agent
  console.log(`No agent found for ID: ${agentId}, creating one`);
  
  // Create a new agent
  const { data: newAgent, error: createError } = await supabase
    .from("agents")
    .insert({
      name: agentId,
      external_id: agentId,
      role: "assistant"
    })
    .select("id")
    .single();
  
  if (createError) {
    console.error("Error creating agent:", createError);
    throw new Error(`Failed to create agent: ${createError.message}`);
  }
  
  console.log(`Created new agent with UUID: ${newAgent.id}`);
  return newAgent.id;
}

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
