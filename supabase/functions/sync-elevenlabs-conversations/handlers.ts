
import { corsHeaders } from "../_shared/cors.ts";
import { SyncRequest, SyncResponse } from "./models.ts";
import { syncConversations } from "./service.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/api-utils.ts";
import { getElevenLabsEnvVars, getSupabaseEnvVars } from "../_shared/env.ts";
import { fetchElevenLabsConversations, fetchAllElevenLabsConversations } from "../_shared/elevenlabs-api.ts";

/**
 * Gère la requête de synchronisation des conversations ElevenLabs
 */
export async function handleSyncRequest(req: Request): Promise<Response> {
  try {
    // Parse request body
    const requestData = await req.json() as SyncRequest;
    const { agentId, fromDate, toDate, limit, usePagination = true } = requestData;
    
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
      
      // Convertir les dates si elles sont fournies
      const parsedFromDate = fromDate ? new Date(fromDate) : undefined;
      const parsedToDate = toDate ? new Date(toDate) : undefined;
      
      let conversations = [];
      
      // Étape 1: Récupérer les conversations de l'agent depuis ElevenLabs
      if (usePagination) {
        console.log("Using pagination to fetch all conversations");
        // Use the new function that handles pagination internally
        conversations = await fetchAllElevenLabsConversations(elevenlabsApiKey, {
          agentId,
          fromDate: parsedFromDate,
          toDate: parsedToDate,
          limit: limit || 100,
          maxPages: 5 // Limit to 5 pages (500 conversations) for safety
        });
      } else {
        console.log("Fetching single page of conversations");
        // For backward compatibility or when pagination is not needed
        const conversationsData = await fetchElevenLabsConversations(elevenlabsApiKey, {
          agentId,
          fromDate: parsedFromDate,
          toDate: parsedToDate,
          limit: limit || 100
        });
        
        if (!conversationsData.conversations || !Array.isArray(conversationsData.conversations)) {
          return createErrorResponse({
            status: 500,
            message: "Invalid response from ElevenLabs API",
            code: "INVALID_RESPONSE"
          });
        }
        
        conversations = conversationsData.conversations;
      }

      console.log(`Total conversations to sync: ${conversations.length}`);
      
      // Étape 2: Synchroniser avec Supabase
      const syncResults = await syncConversations(
        supabaseUrl,
        supabaseServiceKey,
        conversations,
        agentId
      );
      
      // Calculer les statistiques de synchronisation
      const successCount = syncResults.filter(r => r.success).length;
      const errorCount = syncResults.filter(r => !r.success).length;
      
      const response: SyncResponse = {
        success: errorCount === 0,
        results: syncResults,
        summary: {
          total: conversations.length,
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
    console.error("Error in sync-elevenlabs-conversations function:", error);
    return createErrorResponse({
      status: 500,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}
