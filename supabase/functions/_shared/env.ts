
/**
 * Gets required environment variables and throws an error if any are missing
 * @param variables Array of environment variable names to check
 * @returns Object containing the requested environment variables
 */
export function getRequiredEnvVars(variables: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const missing: string[] = [];

  for (const variable of variables) {
    const value = Deno.env.get(variable);
    if (!value) {
      missing.push(variable);
    } else {
      // Convert variable name to camelCase for the result object
      const camelCaseName = variable.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelCaseName] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return result;
}

/**
 * Gets the standard Supabase environment variables needed for most functions
 * @returns Object containing Supabase URL and service role key
 */
export function getSupabaseEnvVars(): { supabaseUrl: string; supabaseServiceKey: string } {
  return getRequiredEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) as {
    supabaseUrl: string;
    supabaseServiceKey: string;
  };
}

/**
 * Gets the ElevenLabs API key from environment variables
 * @returns Object containing the ElevenLabs API key
 */
export function getElevenLabsEnvVars(): { elevenlabsApiKey: string } {
  return getRequiredEnvVars(['ELEVENLABS_API_KEY']) as { elevenlabsApiKey: string };
}
