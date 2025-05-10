
import { corsHeaders } from "./cors.ts";

export type ApiError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

/**
 * Crée une réponse d'erreur formatée avec les headers CORS
 */
export function createErrorResponse(error: ApiError): Response {
  console.error(`API Error [${error.status}]: ${error.message}`, error.details ?? '');
  
  return new Response(
    JSON.stringify({
      error: {
        message: error.message,
        code: error.code ?? 'UNKNOWN_ERROR',
      },
    }),
    {
      status: error.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Crée une réponse réussie avec les headers CORS
 */
export function createSuccessResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Gère la requête OPTIONS pour CORS
 */
export function handleCorsOptions(): Response {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Rapporte les métriques API au moniteur
 */
export async function reportApiMetrics(
  functionName: string, 
  startTime: number, 
  status: number, 
  error?: string
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  try {
    const duration = Date.now() - startTime;
    
    await fetch(`${supabaseUrl}/functions/v1/api-monitor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        functionName,
        duration,
        status,
        error,
        timestamp: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error("Failed to report API metrics:", e);
    // Don't throw - this is a non-critical operation
  }
}
