import { corsHeaders } from "../_shared/cors.ts";
import { getElevenLabsEnvVars } from "../_shared/env.ts";
import { fetchCallInfo, getAudioUrlFromId } from "./database.ts";
import { 
  fetchElevenLabsHistoryItem, 
  fetchElevenLabsConversation,
  fetchElevenLabsConversationTranscript,
  getElevenLabsConversationAudioUrl
} from "../_shared/elevenlabs/conversations.ts";
import { ErrorResponse, CallAudioRequest } from "./types.ts";
import { createErrorResponse } from "../_shared/api-utils.ts";

const processConversationResponse = async (
  conversationId: string, 
  apiKey: string
): Promise<Record<string, any>> => {
  // Récupérer les détails de la conversation
  const conversationData = await fetchElevenLabsConversation(conversationId, apiKey);
  
  // Récupérer la transcription
  const transcriptData = await fetchElevenLabsConversationTranscript(conversationId, apiKey);
  
  // Construire l'URL de l'audio
  const audioUrl = getElevenLabsConversationAudioUrl(conversationId);
  
  // Calculer les statistiques à partir des données disponibles
  const startTime = conversationData.start_time_unix * 1000;
  const endTime = conversationData.end_time_unix ? conversationData.end_time_unix * 1000 : Date.now();
  const durationMs = endTime - startTime;
  
  // Récupérer le texte intégral pour le calcul des statistiques
  const fullText = transcriptData.transcript || 
    conversationData.messages?.map((m: any) => m.text).join(" ") || "";
    
  const words = fullText.trim().split(/\s+/);
  const totalWords = words.length;
  const totalCharacters = fullText.length;
  
  // Statistiques calculées
  const statistics = {
    totalWords,
    totalCharacters,
    durationMs,
    averageWordLength: totalWords > 0 ? totalCharacters / totalWords : 0,
    wordsPerMinute: durationMs > 0 ? (totalWords / durationMs) * 60000 : 0,
    speakingTime: durationMs, // Simplification, on considère tout comme du temps de parole
    silenceTime: 0 // Pas de données de silence disponibles directement
  };
  
  return {
    audioUrl,
    transcript: transcriptData.transcript || fullText,
    summary: "", // L'API conversationnelle ne fournit pas de résumé par défaut
    statistics
  };
};

/**
 * Gère la requête pour récupérer les détails audio d'un appel via ElevenLabs
 */
export async function handleCallAudioRequest(req: Request): Promise<Response> {
  try {
    const { callId, useConversationalApi = false } = await req.json() as CallAudioRequest;
    console.log(`Fetching ElevenLabs audio for call: ${callId}, using Conversational API: ${useConversationalApi}`);
    
    if (!callId) {
      return createErrorResponse("Call ID is required", 400, "BAD_REQUEST");
    }

    // Récupérer la clé API ElevenLabs
    const { elevenlabsApiKey } = getElevenLabsEnvVars();
    
    // Deux approches possibles selon le paramètre useConversationalApi
    if (useConversationalApi) {
      // Utiliser le nouveau endpoint Conversational AI
      console.log("Using Conversational AI endpoint");
      try {
        const result = await processConversationResponse(callId, elevenlabsApiKey);
        
        return new Response(JSON.stringify(result), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        });
      } catch (error) {
        console.error("Error fetching from conversational API:", error);
        // Fallback à l'ancienne méthode si spécifié
        if (error instanceof Response) {
          throw error;
        }
        throw new Error(`Failed to fetch conversation: ${error.message || error}`);
      }
    } else {
      // Utiliser l'ancienne approche via l'API History
      console.log("Using History API endpoint");
      
      // Récupérer les détails de l'appel depuis ElevenLabs
      const historyItem = await fetchElevenLabsHistoryItem(callId, elevenlabsApiKey);
      
      if (!historyItem) {
        return createErrorResponse(`No history item found for call ID: ${callId}`, 404, "NOT_FOUND");
      }
      
      // Préparer la réponse avec les données disponibles
      const response = {
        audioUrl: historyItem.audio_url,
        transcript: historyItem.text,
        // Les autres champs ne sont pas disponibles via cette méthode
        summary: "",
        statistics: {}
      };
      
      return new Response(JSON.stringify(response), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      });
    }
  } catch (error) {
    console.error(`Error in handleCallAudioRequest:`, error);
    
    // Si l'erreur est déjà une Response, la retourner directement
    if (error instanceof Response) {
      return error;
    }
    
    return createErrorResponse(
      `Failed to retrieve call audio: ${error.message || error}`, 
      500, 
      "INTERNAL_SERVER_ERROR"
    );
  }
}
