
import { corsHeaders } from "../_shared/cors.ts";
import { syncHistoryItems } from "./service.ts";
import { fetchElevenLabsHistory } from "../_shared/elevenlabs/history.ts";
import { validateEnvironment, validateRequestParams } from "./validation.ts";
import { verifyUserAccess, createErrorResponse } from "./auth.ts";
import { 
  createSuccessResponse, 
  createElevenLabsErrorResponse, 
  createEmptyResultResponse,
  createGenericErrorResponse
} from "./responses.ts";

// Handle the history sync request
export async function handleHistorySyncRequest(req: Request): Promise<Response> {
  try {
    // Validate environment variables
    const envValidation = validateEnvironment();
    if (!envValidation.success) {
      const errorMsg = `Missing required environment variables: ${envValidation.missingVars?.join(', ')}`;
      console.error(`[handleHistorySyncRequest] ${errorMsg}`);
      return createErrorResponse(errorMsg, "MISSING_ENV_VARIABLES", 500);
    }
    
    const { supabaseUrl, supabaseServiceKey, elevenLabsApiKey } = envValidation;

    // Parse the body to get the agentId
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return createErrorResponse("Invalid request body", "INVALID_REQUEST", 400);
    }
    
    // Validate request parameters
    const paramsValidation = validateRequestParams(body);
    if (!paramsValidation.success) {
      return createErrorResponse(
        paramsValidation.error?.message || "Invalid parameters", 
        paramsValidation.error?.code || "INVALID_PARAMETERS",
        400
      );
    }
    
    const { agentId } = paramsValidation;
    
    // Verify user access
    const accessResult = await verifyUserAccess(
      req.headers.get("Authorization"),
      supabaseUrl,
      supabaseServiceKey,
      agentId
    );
    
    if (!accessResult.success) {
      return createErrorResponse(
        accessResult.error?.message || "Access denied",
        accessResult.error?.code || "ACCESS_DENIED",
        accessResult.error?.status || 403
      );
    }

    console.log(`[handleHistorySyncRequest] Fetching ElevenLabs history for agent ${agentId}`);
    
    // Check if we have a valid API key
    if (!elevenLabsApiKey) {
      console.error("[handleHistorySyncRequest] Missing ElevenLabs API key");
      return createErrorResponse(
        "ElevenLabs API key not configured",
        "MISSING_API_KEY",
        500
      );
    }
    
    // Try to fetch history with enhanced error handling
    try {
      // Fetch the history from ElevenLabs
      const historyResult = await fetchElevenLabsHistory(elevenLabsApiKey);
      
      if (!historyResult.success) {
        console.error(`[handleHistorySyncRequest] Error fetching ElevenLabs history: ${historyResult.error}`);
        return createElevenLabsErrorResponse(historyResult.error || "");
      }
      
      // Check if we have any history items
      if (!historyResult.data || historyResult.data.length === 0) {
        console.log("[handleHistorySyncRequest] No history items found to sync");
        return createEmptyResultResponse();
      }

      // Process the history items
      console.log(`[handleHistorySyncRequest] Syncing ${historyResult.data.length} history items`);
      
      const results = await syncHistoryItems(
        supabaseUrl,
        supabaseServiceKey,
        historyResult.data,
        agentId
      );
      
      // Generate summary statistics
      const summary = {
        total: results.length,
        success: results.filter(r => r.success).length,
        error: results.filter(r => !r.success).length
      };
      
      console.log(`[handleHistorySyncRequest] Sync completed: ${summary.success}/${summary.total} successful, ${summary.error} errors`);

      return createSuccessResponse(results, summary);
    } catch (elevenLabsError) {
      console.error("[handleHistorySyncRequest] Error fetching history from ElevenLabs:", elevenLabsError);
      return createErrorResponse(
        `Error fetching history from ElevenLabs: ${elevenLabsError instanceof Error ? elevenLabsError.message : String(elevenLabsError)}`,
        "ELEVENLABS_FETCH_ERROR",
        500
      );
    }
  } catch (error) {
    console.error(`[handleHistorySyncRequest] Error processing request:`, error);
    return createGenericErrorResponse(error);
  }
}
