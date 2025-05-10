
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CallResponse } from "./models.ts";

/**
 * Récupère les détails d'un appel par son ID
 */
export async function retrieveCall(supabase: SupabaseClient, callId: string): Promise<CallResponse | null> {
  // Récupérer les détails de l'appel par ID
  const { data: call, error } = await supabase
    .from("calls_view")
    .select("*")
    .eq("id", callId)
    .maybeSingle();

  if (error) {
    console.error('Database error when retrieving call:', error);
    throw error;
  }

  if (!call) {
    return null;
  }

  return call as CallResponse;
}
