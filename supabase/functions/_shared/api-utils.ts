
import { corsHeaders } from "./cors.ts";

export interface ApiErrorResponse {
  status: number;
  message: string;
  code: string;
}

/**
 * Crée une réponse d'erreur normalisée
 */
export function createErrorResponse(error: ApiErrorResponse): Response {
  return new Response(
    JSON.stringify({
      error: {
        message: error.message,
        code: error.code,
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
