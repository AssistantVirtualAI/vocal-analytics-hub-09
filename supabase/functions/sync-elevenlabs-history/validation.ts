
/**
 * Validate that all required environment variables are present
 */
export function validateEnvironment(): 
  { success: true; supabaseUrl: string; supabaseServiceKey: string; elevenLabsApiKey: string; } | 
  { success: false; missingVars: string[]; } {
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  // Check for ElevenLabs API key
  const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || Deno.env.get("ELEVEN_LABS_API_KEY");
  
  const missingVars: string[] = [];
  
  if (!supabaseUrl) missingVars.push("SUPABASE_URL");
  if (!supabaseServiceKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!elevenLabsApiKey) missingVars.push("ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY");
  
  if (missingVars.length > 0) {
    return { success: false, missingVars };
  }
  
  return { 
    success: true, 
    supabaseUrl, 
    supabaseServiceKey, 
    elevenLabsApiKey 
  };
}

/**
 * Validate the request parameters
 */
export function validateRequestParams(body: any): 
  { success: true; agentId: string; } | 
  { success: false; error: { message: string; code: string; }; } {
  
  if (!body || typeof body !== 'object') {
    return {
      success: false, 
      error: {
        message: "Invalid request body",
        code: "INVALID_REQUEST"
      }
    };
  }
  
  const { agentId } = body;
  
  if (!agentId) {
    return {
      success: false,
      error: {
        message: "Missing required parameter: agentId",
        code: "MISSING_PARAMETER"
      }
    };
  }
  
  // Log successful validation
  console.log(`[validateRequestParams] Valid request with agentId: ${agentId}`);
  
  return {
    success: true,
    agentId
  };
}
