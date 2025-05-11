
import { corsHeaders } from "../_shared/cors.ts";
import { SyncRequest, SyncResponse } from "./models.ts";
import { syncHistoryItems } from "./service.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/api-utils.ts";
import { getElevenLabsEnvVars, getSupabaseEnvVars } from "../_shared/env.ts";
import { fetchElevenLabsHistory } from "../_shared/elevenlabs-api.ts";
import { getOrCreateAgent } from "../_shared/agent-resolver-improved.ts";

/**
 * Gère la requête de synchronisation de l'historique ElevenLabs
 */
export async function handleSyncRequest(req: Request): Promise<Response> {
  const startTime = Date.now();
  try {
    console.log("Starting sync-elevenlabs-history request handler");
    
    // Parse request body
    const requestData = await req.json() as SyncRequest;
    const { agentId } = requestData;
    
    console.log(`Processing sync request for agent ID: ${agentId}`);
    
    if (!agentId) {
      console.warn("Missing agent ID in request");
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
      
      // Créer un client Supabase
      const supabase = new createClient(supabaseUrl, supabaseServiceKey);
      
      // Utiliser la fonction améliorée pour résoudre ou créer l'agent
      const resolvedAgentId = await getOrCreateAgent(supabase, agentId);
      console.log(`Resolved agent ID: ${resolvedAgentId || 'None (using original ID)'}`);
      
      // Utiliser l'ID résolu s'il existe, sinon utiliser l'ID original
      const effectiveAgentId = resolvedAgentId || agentId;
      
      // Mettre à jour le statut de synchronisation au début pour indiquer que le processus a commencé
      try {
        await supabase
          .from("sync_status")
          .upsert({
            provider: "elevenlabs",
            status: "syncing",
            last_sync_date: new Date().toISOString()
          }, { onConflict: "provider" })
          .select("id");
        
        console.log("Updated sync status to 'syncing'");
      } catch (syncErr) {
        console.warn(`Could not update sync status: ${syncErr instanceof Error ? syncErr.message : String(syncErr)}`);
      }
      
      // Étape 1: Récupérer tous les éléments d'historique de l'agent depuis ElevenLabs
      console.log(`Fetching history items for agent: ${effectiveAgentId} from ElevenLabs API`);
      
      // Utilise notre module partagé pour appeler l'API
      const historyItems = await fetchElevenLabsHistory(elevenlabsApiKey, effectiveAgentId);
      
      console.log(`Retrieved ${historyItems.length} history items from ElevenLabs`);
      
      // Étape 2: Synchroniser avec Supabase
      console.log("Starting synchronization with Supabase database");
      const syncResults = await syncHistoryItems(
        supabaseUrl,
        supabaseServiceKey,
        historyItems,
        effectiveAgentId
      );
      
      // Calculer les statistiques de synchronisation
      const successCount = syncResults.filter(r => r.success).length;
      const errorCount = syncResults.filter(r => !r.success).length;
      
      console.log(`Sync complete. Success: ${successCount}, Errors: ${errorCount}`);
      
      // Mettre à jour le statut de synchronisation à la fin
      try {
        await supabase
          .from("sync_status")
          .upsert({
            provider: "elevenlabs",
            status: errorCount > 0 ? "partial" : "completed",
            last_sync_date: new Date().toISOString()
          }, { onConflict: "provider" })
          .select("id");
        
        console.log(`Updated sync status to '${errorCount > 0 ? "partial" : "completed"}'`);
      } catch (syncErr) {
        console.warn(`Could not update final sync status: ${syncErr instanceof Error ? syncErr.message : String(syncErr)}`);
      }
      
      const response: SyncResponse = {
        success: errorCount === 0,
        results: syncResults,
        summary: {
          total: historyItems.length,
          success: successCount,
          error: errorCount
        }
      };
      
      const duration = Date.now() - startTime;
      console.log(`Sync operation completed in ${duration}ms`);
      
      return createSuccessResponse(response);
    } catch (error) {
      console.error(`Error in sync-elevenlabs-history inner try block: ${error instanceof Error ? error.message : String(error)}`);
      
      // Mettre à jour le statut de synchronisation en cas d'erreur
      try {
        const supabase = new createClient(
          getSupabaseEnvVars().supabaseUrl, 
          getSupabaseEnvVars().supabaseServiceKey
        );
        
        await supabase
          .from("sync_status")
          .upsert({
            provider: "elevenlabs",
            status: "error",
            last_sync_date: new Date().toISOString()
          }, { onConflict: "provider" })
          .select("id");
        
        console.log("Updated sync status to 'error'");
      } catch (syncErr) {
        console.warn(`Could not update sync error status: ${syncErr instanceof Error ? syncErr.message : String(syncErr)}`);
      }
      
      if (error instanceof Error && error.message.includes('environment variable')) {
        return createErrorResponse({
          status: 500,
          message: error.message,
          code: "MISSING_ENV_VAR"
        });
      }
      
      // Check for common ElevenLabs API errors
      if ('status' in error) {
        if (error.status === 401) {
          return createErrorResponse({
            status: 401,
            message: "Invalid ElevenLabs API key",
            code: "INVALID_API_KEY"
          });
        } else if (error.status === 429) {
          return createErrorResponse({
            status: 429,
            message: "ElevenLabs API rate limit exceeded",
            code: "RATE_LIMIT_EXCEEDED"
          });
        } else if (error.status === 404) {
          return createErrorResponse({
            status: 404,
            message: "Agent not found in ElevenLabs API",
            code: "AGENT_NOT_FOUND"
          });
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error(`Error in sync-elevenlabs-history function: ${error instanceof Error ? error.message : String(error)}`);
    
    // Log de debug avec l'erreur complète
    console.debug("Complete error object:", error);
    
    // Essayer d'extraire plus d'informations d'erreur
    let detailedMessage = "An unexpected error occurred";
    let errorCode = "INTERNAL_SERVER_ERROR";
    
    if (error instanceof Error) {
      detailedMessage = error.message;
      
      // Si l'erreur contient une réponse
      if ('response' in error) {
        const response = (error as any).response;
        try {
          const responseBody = response && await response.json();
          detailedMessage = responseBody?.message || responseBody?.error || detailedMessage;
          errorCode = responseBody?.code || errorCode;
          console.error("API error response:", responseBody);
        } catch (jsonErr) {
          console.warn("Could not parse error response body");
        }
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Sync operation failed after ${duration}ms`);
    
    return createErrorResponse({
      status: 500,
      message: detailedMessage,
      code: errorCode
    });
  }
}
