
// Validation utilities for sync-elevenlabs-history function

export interface EnvValidationResult {
  success: boolean;
  missingVars?: string[];
  supabaseUrl?: string;
  supabaseServiceKey?: string;
  elevenLabsApiKey?: string;
}

export interface ParamsValidationResult {
  success: boolean;
  agentId?: string;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Validates that all required environment variables are set
 */
export function validateEnvironment(): EnvValidationResult {
  const missingVars: string[] = [];
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  // Try both ELEVENLABS_API_KEY and ELEVEN_LABS_API_KEY formats
  let elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
  
  if (!elevenLabsApiKey) {
    // Try alternate format
    elevenLabsApiKey = Deno.env.get("ELEVEN_LABS_API_KEY");
  }
  
  if (!supabaseUrl) missingVars.push("SUPABASE_URL");
  if (!supabaseServiceKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!elevenLabsApiKey) missingVars.push("ELEVENLABS_API_KEY and ELEVEN_LABS_API_KEY");
  
  return {
    success: missingVars.length === 0,
    missingVars: missingVars.length > 0 ? missingVars : undefined,
    supabaseUrl,
    supabaseServiceKey,
    elevenLabsApiKey
  };
}

/**
 * Validates request parameters
 */
export function validateRequestParams(params: any): ParamsValidationResult {
  // Check if params is an object
  if (!params || typeof params !== 'object') {
    return {
      success: false,
      error: {
        message: "Invalid request format",
        code: "INVALID_REQUEST"
      }
    };
  }
  
  // Check for required agentId parameter
  const agentId = params.agentId;
  
  if (!agentId) {
    return {
      success: false,
      error: {
        message: "Missing required parameter: agentId",
        code: "MISSING_AGENT_ID"
      }
    };
  }
  
  // Check if agentId is valid format (basic check)
  if (typeof agentId !== 'string' || agentId.trim().length === 0) {
    return {
      success: false,
      error: {
        message: "Invalid agent ID format",
        code: "INVALID_AGENT_ID"
      }
    };
  }
  
  return {
    success: true,
    agentId
  };
}
