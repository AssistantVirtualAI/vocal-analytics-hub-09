
import { corsHeaders } from "../_shared/cors.ts";
import { ErrorCode, CallAudioResponse } from "./types.ts";
import { createErrorResponse, getEnvVars } from "./utils.ts";
import { fetchCallFromDatabase, fetchExistingCallData, updateCallInDatabase } from "./database.ts";
// Import the corrected client function
import { fetchElevenLabsHistoryData } from "./elevenlabs-client.ts";

/**
 * Main request handler function
 * @param req - HTTP request object
 * @returns HTTP response
 */
export async function handleRequest(req: Request): Promise<Response> {
  try {
    // Parse request body and extract callId (which will be used as historyItemId)
    let historyItemId: string | undefined;
    try {
      const body = await req.json();
      historyItemId = body.callId; // Assuming callId from request is the history_item_id
    } catch (parseError) {
      return createErrorResponse("Invalid JSON body", 400, ErrorCode.BAD_REQUEST);
    }

    if (!historyItemId) {
      return createErrorResponse(
        "callId (as historyItemId) is required in the request body",
        400,
        ErrorCode.BAD_REQUEST
      );
    }

    // Get environment variables
    let env;
    try {
      env = getEnvVars();
    } catch (error) {
      return createErrorResponse(error.message, 500, ErrorCode.MISSING_ENV_VAR);
    }

    // Fetch call data from the database (this might need adjustment if the primary ID in DB is not historyItemId)
    // For now, assuming 'callId' from DB maps to 'historyItemId'
    let call;
    try {
      call = await fetchCallFromDatabase(historyItemId, env.supabaseUrl, env.supabaseServiceKey);
    } catch (error) {
      return error; // Already formatted as error response
    }

    // Process the call data using the historyItemId
    const response = await processCall(call, historyItemId, env);
    
    // Return the consolidated data to the client
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Catch-all for any unexpected errors during the process
    console.error("Error in handleRequest:", error);
    return createErrorResponse(
      error.message || "An unexpected error occurred",
      error.status || 500, // Use status from error if available
      error.code || ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Process a call and retrieve all relevant data using historyItemId
 * @param call - Call data object from database (might be minimal or placeholder)
 * @param historyItemId - The ID of the history item in ElevenLabs
 * @param env - Environment variables
 * @returns Response object with audio URL, transcript, summary, and statistics
 */
async function processCall(
  call: { id: string; audio_url?: string | null }, // id here is the historyItemId
  historyItemId: string, 
  env: { elevenlabsApiKey: string; supabaseUrl: string; supabaseServiceKey: string }
): Promise<CallAudioResponse> {
  let audioUrl = call.audio_url || null; // Use existing audio_url from DB if present
  let transcript = ""; // This will be the input text to ElevenLabs
  let summary = ""; // Summary is not directly provided by ElevenLabs history endpoint
  let statistics: any = null; // Statistics will be part of the history data

  // The primary source of truth is now the ElevenLabs history API
  try {
    // Fetch data from ElevenLabs History API using historyItemId
    const historyData = await fetchElevenLabsHistoryData(historyItemId, env.elevenlabsApiKey);
    
    // Update variables with data from ElevenLabs
    audioUrl = historyData.audio_url || audioUrl;
    transcript = historyData.text || ""; // Input text from history
    // Statistics are embedded in historyData, e.g., character count
    // We can pass the whole historyData or extract specific fields for 'statistics'
    statistics = {
      character_count: historyData.character_count_change_to,
      date_unix: historyData.date_unix,
      voice_id: historyData.voice_id,
      voice_name: historyData.voice_name,
      state: historyData.state,
      // Add any other relevant fields from historyData that constitute 'statistics'
    };

    console.log(
      `Received data from ElevenLabs History API for ID ${historyItemId}:\n` +
        `        - Audio URL: ${audioUrl ? audioUrl.substring(0, 50) + "..." : "Not available"}\n` +
        `        - Transcript (Input Text): ${transcript.length} characters\n` +
        `        - Statistics: ${statistics ? JSON.stringify(statistics) : "Not available"}`
    );

    // Asynchronously update the database with the retrieved data
    // The fields to update might need to be adjusted based on the database schema
    if (transcript || audioUrl || statistics) {
      const updatePayload: any = {
        transcript: transcript, // Store the input text as transcript
        // summary: summary, // Summary is not available from this endpoint
        statistics: statistics, // Store the extracted statistics object
      };
      if (audioUrl) {
        updatePayload.audio_url = audioUrl;
      }

      const updatePromise = updateCallInDatabase(
        historyItemId, // Use historyItemId as the primary key for update
        updatePayload,
        env.supabaseUrl,
        env.supabaseServiceKey
      );
      
      // Handle background update (EdgeRuntime specific or fallback)
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(updatePromise);
      } else {
        updatePromise.catch(err => {
          console.error("Error updating database in background:", err);
        });
      }
    }
  } catch (error) {
    // If fetching from ElevenLabs fails, try to use existing data from DB or return error
    console.error(`Error processing ElevenLabs history for ID ${historyItemId}:`, error);
    if (error instanceof Response) {
        // If it's a pre-formatted Response error from the client, re-throw it
        throw error; 
    }
    // If not a Response, it might be an error from createErrorResponse or a generic error
    // Attempt to use existing data if audioUrl was already present from DB
    if (!audioUrl) { // Only throw if we have no audio URL at all
        throw createErrorResponse(
            error.message || `Failed to fetch data for history item ${historyItemId}`,
            error.status || 500,
            error.code || ErrorCode.ELEVENLABS_API_ERROR
        );
    }
    // Log that we are falling back to potentially stale DB data
    console.warn(`Falling back to existing DB data for ${historyItemId} due to ElevenLabs API error.`);
    const existingData = await fetchExistingCallData(historyItemId, env.supabaseUrl, env.supabaseServiceKey);
    transcript = existingData.transcript || transcript;
    summary = existingData.summary || summary;
    statistics = existingData.statistics || statistics;
    // audioUrl is already set from call.audio_url or potentially from a partial success above
  }

  return {
    audioUrl: audioUrl as string, // Assert as string, assuming error thrown if null and required
    transcript,
    summary,
    statistics
  };
}

// Ensure EdgeRuntime is declared if it's used, to avoid TypeScript errors
// This is a common pattern for Supabase Edge Functions
declare var EdgeRuntime: any;
