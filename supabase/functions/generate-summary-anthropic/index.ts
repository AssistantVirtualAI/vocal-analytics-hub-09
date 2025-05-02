import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * Error codes for the summary fallback function.
 */
enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  MISSING_ENV_VAR = "MISSING_ENV_VAR",
  ANTHROPIC_API_ERROR = "ANTHROPIC_API_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * Helper function to create standardized JSON error responses.
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
    let transcript: string | undefined;
    let callId: string | undefined;
    
    try {
      const body = await req.json();
      transcript = body.transcript;
      callId = body.callId;
    } catch (parseError) {
      return createErrorResponse("Invalid JSON body", 400, ErrorCode.BAD_REQUEST);
    }

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return createErrorResponse(
        "Transcript is required in the request body and must be a non-empty string.",
        400,
        ErrorCode.BAD_REQUEST
      );
    }

    if (!callId) {
      return createErrorResponse("Call ID is required", 400, ErrorCode.BAD_REQUEST);
    }

    // --- Get Anthropic API Key from Environment Variables --- 
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    
    if (!anthropicApiKey) {
      return createErrorResponse(
        "ANTHROPIC_API_KEY environment variable is not set.",
        500,
        ErrorCode.MISSING_ENV_VAR
      );
    }

    console.log(`Generating Anthropic summary for call ID: ${callId}`);

    // --- Call Anthropic API (Claude) --- 
    const maxTokensToSample = 500;
    const model = "claude-3-haiku-20240307";

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokensToSample,
          messages: [
            {
              role: "user",
              content: `Please provide a concise summary of the following call transcript. Focus on key points, action items, and important decisions:\n\n${transcript}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Anthropic API Error:", response.status, errorData);
        return createErrorResponse(
          `Anthropic API request failed: ${errorData.error?.message || response.statusText}`,
          response.status,
          ErrorCode.ANTHROPIC_API_ERROR
        );
      }

      const responseData = await response.json();
      
      // Extract the summary from the response
      const generatedSummary = responseData.content?.[0]?.text?.trim() || "";

      if (!generatedSummary) {
        console.warn("Anthropic API returned an empty summary.");
        return createErrorResponse("Failed to generate summary.", 500, ErrorCode.ANTHROPIC_API_ERROR);
      }

      console.log(`Summary generated successfully for call ID: ${callId}`);

      // Initialize Supabase client with service role key
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Update the call record with the generated summary
      const { error: updateError } = await supabase
        .from('calls')
        .update({ summary: generatedSummary })
        .eq('id', callId);

      if (updateError) {
        throw new Error(`Failed to update call summary: ${updateError.message}`);
      }

      // Return the generated summary
      return new Response(
        JSON.stringify({ summary: generatedSummary }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } catch (apiError) {
      console.error("Error calling Anthropic API:", apiError);
      return createErrorResponse(
        `Failed to communicate with Anthropic API: ${apiError.message}`,
        500,
        ErrorCode.ANTHROPIC_API_ERROR
      );
    }

  } catch (error) {
    // Catch-all for unexpected errors
    return createErrorResponse(
      error.message || "An unexpected error occurred",
      500,
      ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
});
