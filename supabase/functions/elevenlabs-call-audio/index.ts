import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Enhanced error codes for more specific feedback to the frontend.
 */
enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  MISSING_ENV_VAR = "MISSING_ENV_VAR",
  DB_ERROR = "DB_ERROR",
  NOT_FOUND = "NOT_FOUND",
  ELEVENLABS_API_ERROR = "ELEVENLABS_API_ERROR",
  ELEVENLABS_AUTH_ERROR = "ELEVENLABS_AUTH_ERROR",
  ELEVENLABS_NOT_FOUND = "ELEVENLABS_NOT_FOUND",
  ELEVENLABS_QUOTA_EXCEEDED = "ELEVENLABS_QUOTA_EXCEEDED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * Helper function to create standardized JSON error responses.
 * @param message - The error message.
 * @param status - The HTTP status code.
 * @param code - The specific error code from the ErrorCode enum.
 * @returns A Response object with the error details.
 */
function createErrorResponse(message: string, status: number, code: ErrorCode) {
  console.error(`Error: ${code} - ${message}`);
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let callId: string | undefined;
    try {
      // Ensure the request body is valid JSON and contains callId
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

    // Check for required environment variables
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsApiKey) {
      return createErrorResponse(
        "ELEVENLABS_API_KEY environment variable is not set",
        500,
        ErrorCode.MISSING_ENV_VAR
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return createErrorResponse(
        "Supabase environment variables are not set",
        500,
        ErrorCode.MISSING_ENV_VAR
      );
    }

    console.log(`Fetching call data for call ID: ${callId}`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the call from the database view to get the initial audio_url
    const { data: call, error: callError } = await supabase
      .from("calls_view") // Using calls_view which might join customer/agent info
      .select("audio_url, agent_id") // Select necessary fields
      .eq("id", callId)
      .single();

    if (callError) {
      return createErrorResponse(
        `Failed to fetch call from database: ${callError.message}`,
        500,
        ErrorCode.DB_ERROR
      );
    }

    if (!call) {
      return createErrorResponse(
        `Call with ID ${callId} not found`,
        404,
        ErrorCode.NOT_FOUND
      );
    }

    if (!call.audio_url) {
      // If the call exists but has no audio URL, return a specific error
      return createErrorResponse(
        `Audio URL not available for call ID ${callId}`,
        404,
        ErrorCode.NOT_FOUND
      );
    }

    let audioUrl = call.audio_url;
    let transcript = "";
    let summary = "";
    let statistics = null;

    // Check if the audio URL points to the ElevenLabs API, indicating it's processed
    if (audioUrl.includes("api.elevenlabs.io")) {
      console.log(
        `Call ${callId} appears to be an ElevenLabs call. Fetching details...`
      );
      // Call the ElevenLabs API for detailed call information (audio, transcript, summary, stats)
      let response: Response;
      try {
        response = await fetch(`https://api.elevenlabs.io/v1/calls/${callId}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "xi-api-key": elevenlabsApiKey, // Use the API key from env vars
          },
        });
      } catch (fetchError) {
        // Handle network errors during the fetch
        return createErrorResponse(
          `Network error fetching from ElevenLabs: ${fetchError.message}`,
          500,
          ErrorCode.ELEVENLABS_API_ERROR
        );
      }

      // Handle non-successful responses from ElevenLabs API
      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json(); // Try to parse error details
        } catch {
          /* Ignore JSON parsing error if body is empty or not JSON */
        }

        const errorMessage =
          errorData.detail?.message ||
          errorData.detail ||
          `ElevenLabs API returned status ${response.status}`;
        console.error(
          "ElevenLabs API error:",
          response.status,
          errorMessage,
          errorData
        );

        // Return specific error codes based on ElevenLabs status
        switch (response.status) {
          case 401:
            return createErrorResponse(
              "Authentication failed with ElevenLabs API. Check API Key.",
              401,
              ErrorCode.ELEVENLABS_AUTH_ERROR
            );
          case 404:
            return createErrorResponse(
              `Call ID ${callId} not found on ElevenLabs.`,
              404,
              ErrorCode.ELEVENLABS_NOT_FOUND
            );
          case 429: // Rate limiting or quota exceeded
            return createErrorResponse(
              "ElevenLabs API rate limit or quota exceeded.",
              429,
              ErrorCode.ELEVENLABS_QUOTA_EXCEEDED
            );
          default:
            return createErrorResponse(
              errorMessage,
              response.status,
              ErrorCode.ELEVENLABS_API_ERROR
            );
        }
      }

      // Process successful response from ElevenLabs
      const data = await response.json();

      // Update variables with data from ElevenLabs, keeping original audioUrl if not provided
      audioUrl = data.audio_url || audioUrl;
      transcript = data.transcript || "";
      // --- Summary Handling --- 
      // The code assumes the 'summary' field is provided by the /v1/calls/{callId} endpoint.
      // Verification needed: Does ElevenLabs automatically generate this summary?
      // If not, a separate process (e.g., another function calling a summarization AI) 
      // would be required to generate it based on the transcript.
      summary = data.summary || ""; 
      statistics = data.statistics || null;

      console.log(
        `Received data from ElevenLabs API for call ${callId}:\n` +
          `        - Audio URL: ${audioUrl.substring(0, 30)}...\n` +
          `        - Transcript: ${transcript.length} characters\n` +
          `        - Summary: ${summary.length} characters (Source: ElevenLabs API response)\n` +
          `        - Statistics: ${statistics ? "Available" : "Not available"}`
      );

      // If statistics were not included in the main call response, attempt to fetch them separately
      if (!statistics) {
        console.log(`Attempting to fetch statistics separately for call ${callId}`);
        try {
          const statsResponse = await fetch(
            `https://api.elevenlabs.io/v1/calls/${callId}/statistics`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "xi-api-key": elevenlabsApiKey,
              },
            }
          );

          if (statsResponse.ok) {
            statistics = await statsResponse.json();
            console.log(
              "Fetched statistics separately:",
              JSON.stringify(statistics)
            );
          } else {
            // Log failure but don't fail the whole request, maybe stats are just not ready/available
            console.warn(
              `Failed to fetch statistics separately: ${statsResponse.status}`
            );
          }
        } catch (statsError) {
          // Log error but don't fail the whole request
          console.error("Error fetching statistics separately:", statsError);
        }
      }

      // Asynchronously update the database with the retrieved data (transcript, summary, stats)
      // We don't wait for this to complete to speed up the response to the client.
      if (transcript || summary || statistics) {
        supabase
          .from("calls")
          .update({
            transcript: transcript || null,
            summary: summary || null, // Store the summary if available
            elevenlabs_statistics: statistics,
          })
          .eq("id", callId)
          .then(({ error: updateError }) => {
            if (updateError) {
              console.error("Error updating call in database:", updateError);
            } else {
              console.log(
                "Successfully initiated update of call in database with ElevenLabs data"
              );
            }
          });
      }
    } else {
      // If the URL is not an ElevenLabs URL, log it and attempt to retrieve existing data from DB
      console.log(
        `Call ${callId} audio URL is not an ElevenLabs URL. Skipping ElevenLabs API call.`
      );
      const { data: existingData, error: existingError } = await supabase
        .from("calls") // Query the 'calls' table directly
        .select("transcript, summary, elevenlabs_statistics")
        .eq("id", callId)
        .single();

      if (existingError) {
        // Log if fetching existing data fails, but don't block the response
        console.warn(
          `Could not fetch existing data for non-ElevenLabs call ${callId}: ${existingError.message}`
        );
      } else if (existingData) {
        // Populate with existing data if found
        transcript = existingData.transcript || "";
        summary = existingData.summary || "";
        statistics = existingData.elevenlabs_statistics || null;
        console.log(
          `Retrieved existing transcript/summary/stats from DB for call ${callId}`
        );
      }
    }

    // Return the consolidated data to the client
    return new Response(
      JSON.stringify({
        audioUrl,
        transcript,
        summary,
        statistics,
        // No 'error' field here indicates success
      }),
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
});
