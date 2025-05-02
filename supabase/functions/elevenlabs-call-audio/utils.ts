
import { corsHeaders } from "../_shared/cors.ts";
import { ErrorCode } from "./types.ts";

/**
 * Helper function to create standardized JSON error responses.
 * @param message - The error message.
 * @param status - The HTTP status code.
 * @param code - The specific error code from the ErrorCode enum.
 * @returns A Response object with the error details.
 */
export function createErrorResponse(message: string, status: number, code: ErrorCode) {
  console.error(`Error: ${code} - ${message}`);
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Get environment variables needed for the function
 * @returns Object containing the required environment variables or throws an error
 */
export function getEnvVars() {
  const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!elevenlabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return {
    elevenlabsApiKey,
    supabaseUrl,
    supabaseServiceKey
  };
}
