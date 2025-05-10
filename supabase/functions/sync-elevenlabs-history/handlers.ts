
import { corsHeaders } from "../_shared/cors.ts";
import { SyncRequest, SyncResponse } from "./models.ts";
import { syncHistoryItems } from "./service.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/api-utils.ts";
import { getElevenLabsEnvVars, getSupabaseEnvVars } from "../_shared/env.ts";
import { fetchElevenLabsHistory } from "../_shared/elevenlabs-api.ts";

/**
 * Gère la requête de synchronisation de l'historique ElevenLabs
 */
export async function handleSyncRequest(req: Request): Promise<Response> {
  try {
    console.log("Starting sync-elevenlabs-history request handler");
    
    // Parse request body
    const requestData = await req.json() as SyncRequest;
    const { agentId } = requestData;
    
    console.log(`Processing sync request for agent ID: ${agentId}`);
    
    if (!agentId) {
      return createErrorResponse({
        status: 400,
        message: "Agent ID is required",
        code: "MISSING_AGENT_ID"
      });
    }

    try {
      console.log("Retrieving environment variables");
      const { elevenlabsApiKey } = getElevenLabsEnvVars();
      const { supabaseUrl, supabaseServiceKey } = getSupabaseEnvVars();
      
      if (!elevenlabsApiKey) {
        console.error("Missing ElevenLabs API key");
        return createErrorResponse({
          status: 500,
          message: "ElevenLabs API key is not configured",
          code: "MISSING_API_KEY"
        });
      }
      
      // Étape 1: Récupérer tous les éléments d'historique de l'agent depuis ElevenLabs
      console.log(`Fetching history items for agent: ${agentId} from ElevenLabs API`);
      
      // Utilise notre module partagé pour appeler l'API
      const historyItems = await fetchElevenLabsHistory(elevenlabsApiKey, agentId);
      
      console.log(`Retrieved ${historyItems.length} history items from ElevenLabs`);
      
      // Étape 2: Synchroniser avec Supabase
      console.log("Starting synchronization with Supabase database");
      const syncResults = await syncHistoryItems(
        supabaseUrl,
        supabaseServiceKey,
        historyItems,
        agentId
      );
      
      // Calculer les statistiques de synchronisation
      const successCount = syncResults.filter(r => r.success).length;
      const errorCount = syncResults.filter(r => !r.success).length;
      
      console.log(`Sync complete. Success: ${successCount}, Errors: ${errorCount}`);
      
      const response: SyncResponse = {
        success: errorCount === 0,
        results: syncResults,
        summary: {
          total: historyItems.length,
          success: successCount,
          error: errorCount
        }
      };
      
      return createSuccessResponse(response);
    } catch (error) {
      console.error(`Error in sync-elevenlabs-history inner try block: ${error.message || error}`);
      
      if (error instanceof Error && error.message.includes('environment variable')) {
        return createErrorResponse({
          status: 500,
          message: error.message,
          code: "MISSING_ENV_VAR"
        });
      }
      
      // Check for common ElevenLabs API errors
      if (error.status === 401) {
        return createErrorResponse({
          status: 401,
          message: "Invalid ElevenLabs API key",
          code: "INVALID_API_KEY"
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error(`Error in sync-elevenlabs-history function: ${error.message || error}`);
    return createErrorResponse({
      status: 500,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}
