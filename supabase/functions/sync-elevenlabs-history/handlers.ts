
import { corsHeaders } from "../_shared/cors.ts";
import { SyncRequest, SyncResponse } from "./models.ts";
import { fetchElevenLabsHistory, syncHistoryItems } from "./service.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/api-utils.ts";

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

    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!elevenlabsApiKey) {
      return createErrorResponse({
        status: 500,
        message: "ELEVENLABS_API_KEY environment variable is not set",
        code: "MISSING_API_KEY"
      });
    }

    // Étape 1: Récupérer tous les éléments d'historique de l'agent depuis ElevenLabs
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
    console.error("Error in sync-elevenlabs-history function:", error);
    return createErrorResponse({
      status: 500,
      message: error.message || "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}
