
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
    // Parse request body
    const requestData = await req.json() as SyncRequest;
    const { agentId } = requestData;
    
    if (!agentId) {
      return createErrorResponse({
        status: 400,
        message: "Agent ID is required",
        code: "MISSING_AGENT_ID"
      });
    }

    try {
      const { elevenlabsApiKey } = getElevenLabsEnvVars();
      const { supabaseUrl, supabaseServiceKey } = getSupabaseEnvVars();
      
      // Étape 1: Récupérer tous les éléments d'historique de l'agent depuis ElevenLabs
      // Utilise notre module partagé pour appeler l'API
      const historyItems = await fetchElevenLabsHistory(elevenlabsApiKey, agentId);
      
      // Étape 2: Synchroniser avec Supabase
      const syncResults = await syncHistoryItems(
        supabaseUrl,
        supabaseServiceKey,
        historyItems,
        agentId
      );
      
      // Calculer les statistiques de synchronisation
      const successCount = syncResults.filter(r => r.success).length;
      const errorCount = syncResults.filter(r => !r.success).length;
      
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
      if (error instanceof Error && error.message.includes('environment variable')) {
        return createErrorResponse({
          status: 500,
          message: error.message,
          code: "MISSING_ENV_VAR"
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in sync-elevenlabs-history function:", error);
    return createErrorResponse({
      status: 500,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}
