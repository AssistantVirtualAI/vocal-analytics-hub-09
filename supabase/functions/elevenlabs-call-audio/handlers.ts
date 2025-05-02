
import { corsHeaders } from "../_shared/cors.ts";
import { ErrorCode, CallAudioResponse } from "./types.ts";
import { createErrorResponse, getEnvVars } from "./utils.ts";
import { fetchCallFromDatabase, fetchExistingCallData, updateCallInDatabase } from "./database.ts";
import { fetchElevenLabsData, fetchElevenLabsStatistics } from "./elevenlabs-client.ts";

/**
 * Main request handler function
 * @param req - HTTP request object
 * @returns HTTP response
 */
export async function handleRequest(req: Request): Promise<Response> {
  try {
    // Parse request body and extract callId
    let callId: string | undefined;
    try {
      const body = await req.json();
      callId = body.callId;
    } catch (parseError) {
      return createErrorResponse("Invalid JSON body", 400, ErrorCode.BAD_REQUEST);
    }

    if (!callId) {
      return createErrorResponse(
        "Call ID is required in the request body",
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

    // Fetch call data from the database
    let call;
    try {
      call = await fetchCallFromDatabase(callId, env.supabaseUrl, env.supabaseServiceKey);
    } catch (error) {
      return error; // Already formatted as error response
    }

    // Process the call data
    const response = await processCall(call, env);
    
    // Return the consolidated data to the client
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Catch-all for any unexpected errors during the process
    return createErrorResponse(
      error.message || "An unexpected error occurred",
      500,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Process a call and retrieve all relevant data
 * @param call - Call data object
 * @param env - Environment variables
 * @returns Response object with audio URL, transcript, summary, and statistics
 */
async function processCall(call: { id: string; audio_url: string }, env: { elevenlabsApiKey: string; supabaseUrl: string; supabaseServiceKey: string }): Promise<CallAudioResponse> {
  const callId = call.id;
  let audioUrl = call.audio_url;
  let transcript = "";
  let summary = "";
  let statistics = null;

  // Check if the audio URL points to the ElevenLabs API, indicating it's processed
  if (audioUrl.includes("api.elevenlabs.io")) {
    try {
      // Fetch data from ElevenLabs API
      const data = await fetchElevenLabsData(callId, env.elevenlabsApiKey);
      
      // Update variables with data from ElevenLabs
      audioUrl = data.audio_url || audioUrl;
      transcript = data.transcript || "";
      summary = data.summary || "";
      statistics = data.statistics || null;

      console.log(
        `Received data from ElevenLabs API for call ${callId}:\n` +
          `        - Audio URL: ${audioUrl.substring(0, 30)}...\n` +
          `        - Transcript: ${transcript.length} characters\n` +
          `        - Summary: ${summary.length} characters\n` +
          `        - Statistics: ${statistics ? "Available" : "Not available"}`
      );

      // If statistics were not included in the main call response, attempt to fetch them separately
      if (!statistics) {
        statistics = await fetchElevenLabsStatistics(callId, env.elevenlabsApiKey);
      }

      // Asynchronously update the database with the retrieved data
      if (transcript || summary || statistics) {
        // Use EdgeRuntime.waitUntil to run this in the background
        // without blocking the response
        const updatePromise = updateCallInDatabase(
          callId,
          { transcript, summary, statistics },
          env.supabaseUrl,
          env.supabaseServiceKey
        );
        
        try {
          EdgeRuntime.waitUntil(updatePromise);
        } catch {
          // Fallback if waitUntil is not available
          updatePromise.catch(err => {
            console.error("Error updating database in background:", err);
          });
        }
      }
    } catch (error) {
      if (error instanceof Response) {
        throw error; // Already formatted as error response
      }
      console.error("Error processing ElevenLabs call:", error);
      // Continue with existing data if available
    }
  } else {
    // If the URL is not an ElevenLabs URL, retrieve existing data from DB
    console.log(`Call ${callId} audio URL is not an ElevenLabs URL. Fetching existing data.`);
    const existingData = await fetchExistingCallData(callId, env.supabaseUrl, env.supabaseServiceKey);
    transcript = existingData.transcript;
    summary = existingData.summary;
    statistics = existingData.statistics;
  }

  return {
    audioUrl,
    transcript,
    summary,
    statistics
  };
}
