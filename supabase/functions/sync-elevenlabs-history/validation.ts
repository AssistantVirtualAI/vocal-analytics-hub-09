
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Validates required environment variables for the function
 */
export function validateEnvironment(): {
  success: boolean;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
  elevenLabsApiKey?: string;
  missingVars?: string[];
} {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || Deno.env.get("ELEVEN_LABS_API_KEY");
  
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!elevenLabsApiKey) missingVars.push('ELEVENLABS_API_KEY/ELEVEN_LABS_API_KEY');
  
  if (missingVars.length > 0) {
    return {
      success: false,
      missingVars
    };
  }
  
  return {
    success: true,
    supabaseUrl,
    supabaseServiceKey,
    elevenLabsApiKey
  };
}

/**
 * Validates request parameters
 */
export function validateRequestParams(body: any): {
  success: boolean;
  agentId?: string;
  error?: {message: string; code: string};
} {
  const { agentId } = body || {};
  
  if (!agentId) {
    return {
      success: false,
      error: {
        message: "agentId is required",
        code: "MISSING_AGENT_ID"
      }
    };
  }
  
  return {
    success: true,
    agentId
  };
}
