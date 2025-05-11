
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getElevenLabsEnvVars } from "../_shared/env.ts";
import { createErrorResponse, createSuccessResponse, handleCorsOptions } from "../_shared/api-utils.ts";
import { fetchElevenLabsConversations, fetchAllElevenLabsConversations } from "../_shared/elevenlabs-api.ts";
import { getOrCreateAgent } from "../_shared/agent-resolver-improved.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseEnvVars } from "../_shared/env.ts";

const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";

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

    // Check agent resolver
    console.log("Testing agent resolver with ID:", agentId);
    const resolvedAgentId = await getOrCreateAgent(supabase, agentId);
    console.log("Resolved agent ID:", resolvedAgentId || "None (using original ID)");
    const effectiveAgentId = resolvedAgentId || agentId;

    // Check if the ID matches our new agent ID
    const isNewAgent = effectiveAgentId === "2df8e9d7-0939-4bd8-9da1-c99ac86eb2f8" || effectiveAgentId === "QNdB45Jpgh06Hr67TzFO";
    console.log("Is this our new agent?", isNewAgent);

    // Check calls/conversations API
    console.log("Testing ElevenLabs conversations API");
    const diagnosticResults = {
      agentDetails: {
        providedId: agentId,
        resolvedId: resolvedAgentId,
        effectiveId: effectiveAgentId,
        isNewAgent: isNewAgent
      },
      apiConnection: {
        success: false,
        error: null
      },
      conversationsApi: {
        success: false,
        error: null,
        count: 0,
        data: null
      },
      dashboardSettings: {
        success: false,
        error: null,
        data: null
      },
      historyApi: {
        success: false,
        error: null,
        count: 0
      }
    };

    // Test basic API connection
    try {
      const response = await fetch(`${ELEVENLABS_API_BASE_URL}/user`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "xi-api-key": elevenlabsApiKey,
        }
      });

      if (response.ok) {
        const userData = await response.json();
        diagnosticResults.apiConnection.success = true;
        diagnosticResults.apiConnection.data = {
          subscription: userData.subscription?.tier || "Unknown",
          username: userData.username || "Unknown"
        };
      } else {
        const status = response.status;
        let errorMessage = `ElevenLabs API returned status ${status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail?.message || errorData.detail || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response from /user", parseError);
        }
        diagnosticResults.apiConnection.error = `${status}: ${errorMessage}`;
      }
    } catch (error) {
      diagnosticResults.apiConnection.error = `Network error: ${error.message || error}`;
    }

    // Test conversations API
    try {
      console.log(`Testing conversations API for agent ID: ${effectiveAgentId}`);
      const conversationsData = await fetchElevenLabsConversations(elevenlabsApiKey, {
        agentId: effectiveAgentId,
        limit: 5
      });
      
      diagnosticResults.conversationsApi.success = true;
      diagnosticResults.conversationsApi.count = conversationsData.conversations?.length || 0;
      diagnosticResults.conversationsApi.data = {
        sampleItems: conversationsData.conversations?.slice(0, 2) || [],
        hasCursor: !!conversationsData.cursor
      };
    } catch (error) {
      console.error("Error testing conversations API:", error);
      diagnosticResults.conversationsApi.error = error.message || String(error);
    }

    // Test dashboard settings API
    try {
      console.log("Testing dashboard settings API");
      const response = await fetch(`${ELEVENLABS_API_BASE_URL}/convai/dashboard-settings`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "xi-api-key": elevenlabsApiKey,
        }
      });

      if (response.ok) {
        const dashboardData = await response.json();
        diagnosticResults.dashboardSettings.success = true;
        diagnosticResults.dashboardSettings.data = dashboardData;
      } else {
        const status = response.status;
        let errorMessage = `Dashboard settings API returned status ${status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail?.message || errorData.detail || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response", parseError);
        }
        diagnosticResults.dashboardSettings.error = `${status}: ${errorMessage}`;
      }
    } catch (error) {
      diagnosticResults.dashboardSettings.error = `Network error: ${error.message || error}`;
    }

    // Test history API
    try {
      console.log("Testing history API (limited to 5 items)");
      const historyItems = await fetch(`${ELEVENLABS_API_BASE_URL}/history?page_size=5`, {
        method: "GET", 
        headers: {
          "Accept": "application/json",
          "xi-api-key": elevenlabsApiKey,
        }
      });
      
      if (historyItems.ok) {
        const historyData = await historyItems.json();
        diagnosticResults.historyApi.success = true;
        diagnosticResults.historyApi.count = historyData.history?.length || 0;
      } else {
        const status = historyItems.status;
        let errorMessage = `History API returned status ${status}`;
        diagnosticResults.historyApi.error = `${status}: ${errorMessage}`;
      }
    } catch (error) {
      diagnosticResults.historyApi.error = `Network error: ${error.message || error}`;
    }

    // Check database for existing synced calls
    try {
      console.log("Checking database for existing calls");
      const { data: existingCalls, error: dbError } = await supabase
        .from('calls')
        .select('id')
        .eq('agent_id', effectiveAgentId)
        .limit(5);
      
      diagnosticResults.database = {
        success: !dbError,
        error: dbError ? dbError.message : null,
        callsFound: existingCalls?.length || 0
      };
    } catch (error) {
      diagnosticResults.database = {
        success: false,
        error: `Error querying database: ${error.message || error}`,
        callsFound: 0
      };
    }

    console.log("Diagnostic complete");
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
