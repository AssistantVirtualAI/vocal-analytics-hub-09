
import { corsHeaders } from "../_shared/cors.ts";
import { SyncRequest, SyncResponse } from "./models.ts";
import { syncHistoryItems } from "./service.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/api-utils.ts";
import { getElevenLabsEnvVars, getSupabaseEnvVars } from "../_shared/env.ts";
import { fetchElevenLabsHistory } from "../_shared/elevenlabs/history.ts";

/**
 * Gère la requête de synchronisation de l'historique ElevenLabs
 */
export async function handleHistorySyncRequest(req: Request): Promise<Response> {
  try {
    // Valider les variables d'environnement avant tout
    console.log("Vérification des variables d'environnement essentielles...");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVEN_LABS_API_KEY');
    
    if (!supabaseUrl) {
      console.error("SUPABASE_URL n'est pas défini");
      return createErrorResponse({
        status: 500,
        message: "Configuration incorrecte: SUPABASE_URL manquant",
        code: "MISSING_ENV_VAR"
      });
    }
    
    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY n'est pas défini");
      return createErrorResponse({
        status: 500,
        message: "Configuration incorrecte: SUPABASE_SERVICE_ROLE_KEY manquant",
        code: "MISSING_ENV_VAR"
      });
    }
    
    if (!elevenlabsApiKey) {
      console.error("ELEVENLABS_API_KEY et ELEVEN_LABS_API_KEY ne sont pas définis");
      return createErrorResponse({
        status: 500,
        message: "Configuration incorrecte: Clé API ElevenLabs manquante",
        code: "MISSING_ENV_VAR"
      });
    }
    
    // Parse request body
    console.log("Analyse de la requête...");
    let requestData: SyncRequest;
    try {
      requestData = await req.json() as SyncRequest;
      console.log("Données de requête reçues:", JSON.stringify(requestData));
    } catch (error) {
      console.error("Erreur lors de l'analyse du JSON de la requête:", error);
      return createErrorResponse({
        status: 400,
        message: "Format de requête invalide",
        code: "INVALID_REQUEST"
      });
    }
    
    const { agentId } = requestData;
    
    if (!agentId) {
      console.error("Missing agentId in request body");
      return createErrorResponse({
        status: 400,
        message: "Agent ID is required",
        code: "MISSING_AGENT_ID"
      });
    }

    try {
      console.log("Getting environment variables...");
      
      // Utiliser directement les variables d'environnement validées
      console.log(`Environnement: API key: ${elevenlabsApiKey ? "***" + elevenlabsApiKey.substring(elevenlabsApiKey.length - 4) : "undefined"}`);
      console.log(`Supabase URL: ${supabaseUrl || "undefined"}`);
      console.log(`Supabase service key present: ${supabaseServiceKey ? "Yes" : "No"}`);
      
      // Récupérer l'historique depuis ElevenLabs
      console.log(`Fetching history from ElevenLabs for agent ${agentId}...`);
      const historyItems = await fetchElevenLabsHistory(elevenlabsApiKey, agentId);
      
      console.log(`Retrieved ${historyItems.length} history items for agent ${agentId}`);
      
      if (!Array.isArray(historyItems)) {
        console.error("Invalid response from ElevenLabs API - not an array:", historyItems);
        return createErrorResponse({
          status: 500,
          message: "Invalid response from ElevenLabs API",
          code: "INVALID_RESPONSE"
        });
      }
      
      // Synchroniser avec Supabase
      console.log(`Syncing ${historyItems.length} history items with Supabase...`);
      const syncResults = await syncHistoryItems(
        supabaseUrl,
        supabaseServiceKey,
        historyItems,
        agentId
      );
      
      // Calculer les statistiques de synchronisation
      const successCount = syncResults.filter(r => r.success).length;
      const errorCount = syncResults.filter(r => !r.success).length;
      
      console.log(`Sync complete. Success: ${successCount}, Error: ${errorCount}`);
      
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
      console.error("Error accessing environment variables or API:", error);
      
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
