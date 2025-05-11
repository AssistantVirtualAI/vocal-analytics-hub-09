
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getElevenLabsEnvVars } from "../_shared/env.ts";
import { createErrorResponse, createSuccessResponse, handleCorsOptions } from "../_shared/api-utils.ts";
import { getSupabaseEnvVars } from "../_shared/env.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runDiagnostics } from "./handlers.ts";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    // This is a diagnostic tool so we'll log everything extensively
    console.log("Starting ElevenLabs diagnostic process");

    // Get environment variables
    const { elevenlabsApiKey } = getElevenLabsEnvVars();
    const { supabaseUrl, supabaseServiceKey } = getSupabaseEnvVars();

    if (!elevenlabsApiKey) {
      return createErrorResponse({
        status: 500,
        message: "ElevenLabs API key is not configured",
        code: "MISSING_API_KEY"
      });
    }

    // Parse request body
    const { agentId } = await req.json();

    if (!agentId) {
      return createErrorResponse({
        status: 400,
        message: "Agent ID is required for diagnostics",
        code: "MISSING_AGENT_ID"
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Run diagnostics
    const diagnosticResults = await runDiagnostics(elevenlabsApiKey, agentId, supabase);

    return createSuccessResponse({
      success: true,
      message: "ElevenLabs API diagnostic complete",
      results: diagnosticResults
    });
  } catch (error) {
    console.error("Error in elevenlabs-diagnostic function:", error);
    return createErrorResponse({
      status: 500,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
});
