
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createErrorResponse, createSuccessResponse, handleCorsOptions } from "../_shared/api-utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runDiagnostics } from "./handlers.ts";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    // This is a diagnostic tool so we'll log extensively
    console.log("Starting ElevenLabs diagnostic process");

    // Get environment variables
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') || 
                             Deno.env.get('ELEVEN_LABS_API_KEY');

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!elevenlabsApiKey) {
      return createErrorResponse({
        status: 500,
        message: "ElevenLabs API key is not configured",
        code: "MISSING_API_KEY"
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return createErrorResponse({
        status: 500,
        message: "Supabase configuration is missing",
        code: "MISSING_SUPABASE_CONFIG"
      });
    }

    // Parse request body
    let agentId;
    try {
      const body = await req.json();
      agentId = body.agentId;
    } catch (error) {
      return createErrorResponse({
        status: 400,
        message: "Invalid JSON body",
        code: "INVALID_REQUEST"
      });
    }

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
    try {
      const diagnosticResults = await runDiagnostics(elevenlabsApiKey, agentId, supabase);

      return createSuccessResponse({
        success: true,
        message: "ElevenLabs API diagnostic complete",
        results: diagnosticResults
      });
    } catch (diagError) {
      console.error("Error running diagnostics:", diagError);
      return createErrorResponse({
        status: 500,
        message: diagError instanceof Error ? diagError.message : "Diagnostic execution failed",
        code: "DIAGNOSTIC_ERROR"
      });
    }
  } catch (error) {
    console.error("Error in elevenlabs-diagnostic function:", error);
    return createErrorResponse({
      status: 500,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
});
