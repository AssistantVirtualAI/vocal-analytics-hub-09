import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  Conversation, 
  CallData, 
  SyncResult 
} from "./models.ts";
import { 
  fetchElevenLabsConversations, 
  fetchAllElevenLabsConversations, 
  fetchElevenLabsConversationTranscript 
} from "../_shared/elevenlabs/conversations.ts";

/**
 * Convertit une conversation en données d'appel pour la base de données
 */
export function mapConversationToCallData(
  conversation: Conversation, 
  agentId: string,
  apiKey: string
): Promise<CallData> {
  // Récupérer la transcription complète si disponible
  return fetchElevenLabsConversationTranscript(conversation.id, apiKey)
    .then(transcriptData => {
      const transcript = transcriptData.transcript || 
        conversation.messages?.map(m => `${m.role}: ${m.text}`).join('\n') || '';
      
      return {
        id: conversation.id,
        audio_url: `https://api.elevenlabs.io/v1/convai/conversations/${conversation.id}/audio`,
        agent_id: agentId,
        date: new Date(conversation.start_time_unix * 1000).toISOString(),
        customer_id: null,
        customer_name: conversation.title || "Client inconnu",
        satisfaction_score: 0,
        duration: conversation.duration_seconds || 
          (conversation.end_time_unix ? conversation.end_time_unix - conversation.start_time_unix : 0),
        transcript: transcript
      };
    })
    .catch(error => {
      console.warn(`Failed to fetch transcript for conversation ${conversation.id}:`, error);
      
      // Fallback à une version basique sans transcription détaillée
      return {
        id: conversation.id,
        audio_url: `https://api.elevenlabs.io/v1/convai/conversations/${conversation.id}/audio`,
        agent_id: agentId,
        date: new Date(conversation.start_time_unix * 1000).toISOString(),
        customer_id: null,
        customer_name: conversation.title || "Client inconnu",
        satisfaction_score: 0,
        duration: conversation.duration_seconds || 
          (conversation.end_time_unix ? conversation.end_time_unix - conversation.start_time_unix : 0),
        transcript: conversation.messages?.map(m => `${m.role}: ${m.text}`).join('\n') || ""
      };
    });
}

/**
 * Synchronise une conversation avec la base de données
 */
export async function syncConversation(
  supabase: SupabaseClient,
  conversation: Conversation,
  agentId: string,
  apiKey: string
): Promise<SyncResult> {
  try {
    // Vérifier si l'appel existe déjà
    const { data: existingCall } = await supabase
      .from("calls")
      .select("id")
      .eq("id", conversation.id)
      .maybeSingle();
    
    // Préparer les données de l'appel
    const callData = await mapConversationToCallData(conversation, agentId, apiKey);
    
    if (existingCall) {
      // Mettre à jour l'appel existant
      const { error } = await supabase
        .from("calls")
        .update(callData)
        .eq("id", conversation.id);
      
      if (error) {
        throw error;
      }
      
      return { id: conversation.id, success: true, action: "updated" };
    } else {
      // Insérer un nouvel appel
      const { error } = await supabase
        .from("calls")
        .insert(callData);
      
      if (error) {
        throw error;
      }
      
      return { id: conversation.id, success: true, action: "created" };
    }
  } catch (error) {
    console.error(`Error syncing conversation ${conversation.id}:`, error);
    return { 
      id: conversation.id, 
      success: false, 
      error: error.message || "Unknown error"
    };
  }
}

/**
 * Synchronise plusieurs conversations avec la base de données
 */
export async function syncConversations(
  supabaseUrl: string, 
  supabaseServiceKey: string,
  conversations: Conversation[],
  agentId: string
): Promise<SyncResult[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  // Récupérer la clé API ElevenLabs
  const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || "";
  
  if (!elevenlabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }
  
  const results: SyncResult[] = [];
  
  for (const conversation of conversations) {
    const result = await syncConversation(supabase, conversation, agentId, elevenlabsApiKey);
    results.push(result);
  }
  
  return results;
}
