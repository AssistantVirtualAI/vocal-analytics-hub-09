
import { corsHeaders } from "./cors.ts";

export interface ApiErrorResponse {
  status: number;
  message: string;
  code: string;
  details?: string;
}

/**
 * Crée une réponse d'erreur normalisée
 */
export function createErrorResponse(error: ApiErrorResponse): Response {
  console.error(`Error: ${error.code} - ${error.message}`, error.details || '');
  
  return new Response(
    JSON.stringify({
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      },
      success: false,
    }),
    {
      status: error.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Crée une réponse de succès normalisée
 */
export function createSuccessResponse<T>(data: T): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Gère les requêtes CORS OPTIONS
 */
export function handleCorsOptions(): Response {
  return new Response(null, {
    headers: corsHeaders,
    status: 204, // No Content
  });
}

/**
 * Report API metrics to the api-monitor function
 */
export async function reportApiMetrics(
  functionName: string,
  startTime: number,
  statusCode: number,
  errorMessage?: string
): Promise<void> {
  try {
    const duration = Date.now() - startTime;
    
    // Skip reporting in development environments
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      return;
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Cannot report metrics: Missing Supabase credentials');
      return;
    }
    
    const payload = {
      function_name: functionName,
      duration_ms: duration,
      status_code: statusCode,
      error: errorMessage || null,
      timestamp: new Date().toISOString(),
    };
    
    // Use fetch directly rather than supabase client to avoid circular dependencies
    await fetch(`${supabaseUrl}/functions/v1/api-monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(payload),
    });
    
  } catch (error) {
    // Just log but don't fail the original request
    console.error('Failed to report API metrics:', error);
  }
}
