
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Crée et retourne une instance client Supabase avec le rôle de service
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Obtient un enregistrement par ID avec gestion d'erreur
 */
export async function getRecordById<T>(
  client: SupabaseClient,
  table: string,
  id: string,
  columns = "*"
): Promise<T | null> {
  const { data, error } = await client
    .from(table)
    .select(columns)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching ${table} with ID ${id}:`, error);
    throw error;
  }

  return data as T | null;
}
