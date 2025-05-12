
/**
 * Validation functions for the sync-elevenlabs-history edge function
 */

/**
 * Validate required environment variables
 */
export function validateEnvironment() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || Deno.env.get("ELEVEN_LABS_API_KEY");

  const missingVars = [];
  
  if (!supabaseUrl) missingVars.push("SUPABASE_URL");
  if (!supabaseServiceKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!elevenLabsApiKey) missingVars.push("ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY");
  
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
 * Validate request parameters
 */
export function validateRequestParams(body: any) {
  if (!body || typeof body !== 'object') {
    return {
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Invalid request body"
      }
    };
  }
  
  // Check for required agentId parameter
  const { agentId } = body;
  
  if (!agentId) {
    return {
      success: false,
      error: {
        code: "MISSING_AGENT_ID",
        message: "Missing required parameter: agentId"
      }
    };
  }
  
  return {
    success: true,
    agentId
  };
}
