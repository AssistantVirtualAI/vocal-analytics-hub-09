
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CallData } from "./types.ts";
import { ErrorCode } from "./types.ts";
import { createErrorResponse } from "./utils.ts";

/**
 * Fetch call data from the database
 * @param callId - ID of the call to fetch
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service role key
 * @returns Call data object
 */
export async function fetchCallFromDatabase(callId: string, supabaseUrl: string, supabaseKey: string): Promise<CallData> {
  console.log(`Fetching call data for call ID: ${callId}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: call, error: callError } = await supabase
    .from("calls_view")
    .select("audio_url, agent_id")
    .eq("id", callId)
    .single();

  if (callError) {
    throw createErrorResponse(
      `Failed to fetch call from database: ${callError.message}`,
      500,
      ErrorCode.DB_ERROR
    );
  }

  if (!call) {
    throw createErrorResponse(
      `Call with ID ${callId} not found`,
      404,
      ErrorCode.NOT_FOUND
    );
  }

  if (!call.audio_url) {
    throw createErrorResponse(
      `Audio URL not available for call ID ${callId}`,
      404,
      ErrorCode.NOT_FOUND
    );
  }

  return { id: callId, ...call };
}

/**
 * Fetch existing call data from the database (transcript, summary, stats)
 * @param callId - ID of the call
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service role key
 * @returns Object containing transcript, summary, and statistics
 */
export async function fetchExistingCallData(callId: string, supabaseUrl: string, supabaseKey: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase
      .from("calls")
      .select("transcript, summary, elevenlabs_statistics")
      .eq("id", callId)
      .single();

    if (error) {
      console.warn(`Could not fetch existing data for call ${callId}: ${error.message}`);
      return { transcript: "", summary: "", statistics: null };
    }

    return {
      transcript: data.transcript || "",
      summary: data.summary || "",
      statistics: data.elevenlabs_statistics || null,
    };
  } catch (error) {
    console.error(`Error fetching existing call data: ${error.message}`);
    return { transcript: "", summary: "", statistics: null };
  }
}

/**
 * Update call data in the database with new information
 * @param callId - ID of the call to update
 * @param data - Object containing transcript, summary, and statistics
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service role key
 */
export async function updateCallInDatabase(
  callId: string, 
  data: { transcript?: string; summary?: string; statistics?: any },
  supabaseUrl: string,
  supabaseKey: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { error } = await supabase
    .from("calls")
    .update({
      transcript: data.transcript || null,
      summary: data.summary || null,
      elevenlabs_statistics: data.statistics,
    })
    .eq("id", callId);

  if (error) {
    console.error("Error updating call in database:", error);
    return false;
  }
  
  console.log("Successfully updated call in database with ElevenLabs data");
  return true;
}
