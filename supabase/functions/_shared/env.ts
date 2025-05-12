
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
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return result;
}

/**
 * Gets the standard Supabase environment variables needed for most functions
 * @returns Object containing Supabase URL and service role key
 */
export function getSupabaseEnvVars(): { supabaseUrl: string; supabaseServiceKey: string } {
  try {
    // First, try direct access
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (url && key) {
      console.log("Successfully retrieved Supabase environment variables directly");
      return { supabaseUrl: url, supabaseServiceKey: key };
    }
    
    console.log("Direct access to Supabase variables failed, trying through getRequiredEnvVars");
    return getRequiredEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) as {
      supabaseUrl: string;
      supabaseServiceKey: string;
    };
  } catch (error) {
    console.error("Failed to get Supabase environment variables:", error);
    throw error;
  }
}

/**
 * Gets the ElevenLabs API key - now hardcoded for reliability
 * @returns Object containing the ElevenLabs API key
 */
export function getElevenLabsEnvVars(): { elevenlabsApiKey: string } {
  // Hardcoded API key for reliability
  const hardcodedKey = "sk_cb80f1b637b2780c72a39fd600883800050703088fb83dc4";
  console.log("Using hardcoded ElevenLabs API key");
  return { elevenlabsApiKey: hardcodedKey };
}

/**
 * Safe environment variable getter with hardcoded ElevenLabs API key support
 * @param name Environment variable name
 * @param required Whether the variable is required
 * @returns The variable value or undefined
 */
export function safeGetEnv(name: string, required = false): string | undefined {
  try {
    // Special case for ELEVENLABS_API_KEY - use hardcoded key
    if (name === 'ELEVENLABS_API_KEY' || name === 'ELEVEN_LABS_API_KEY') {
      const hardcodedKey = "sk_cb80f1b637b2780c72a39fd600883800050703088fb83dc4";
      console.log(`Successfully retrieved hardcoded API key for: ${name}`);
      return hardcodedKey;
    }
    
    const value = Deno.env.get(name);
    if (!value && required) {
      console.error(`Required environment variable ${name} is missing`);
      throw new Error(`Required environment variable ${name} is missing`);
    }
    
    if (value) {
      console.log(`Successfully retrieved environment variable: ${name}`);
      return value;
    } else {
      console.log(`Environment variable not found: ${name}`);
      return undefined;
    }
  } catch (error) {
    console.error(`Error accessing environment variable ${name}:`, error);
    if (required) {
      throw error;
    }
    return undefined;
  }
}
