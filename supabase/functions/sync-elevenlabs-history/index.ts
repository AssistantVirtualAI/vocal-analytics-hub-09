
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions } from "../_shared/api-utils.ts";
import { handleHistorySyncRequest } from "./handlers.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const startTime = Date.now();
  const functionName = "sync-elevenlabs-history";
  
  console.log(`[${functionName}] Request received: ${req.method} ${req.url}`);
  
  // Log all environment variables for debugging
  try {
    console.log(`[${functionName}] Environment check - SUPABASE_URL: ${Deno.env.get('SUPABASE_URL') ? 'Present' : 'Missing'}`);
    console.log(`[${functionName}] Environment check - SUPABASE_SERVICE_ROLE_KEY: ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Present' : 'Missing'}`);
    console.log(`[${functionName}] Environment check - ELEVENLABS_API_KEY: ${Deno.env.get('ELEVENLABS_API_KEY') ? 'Present' : 'Missing'}`);
    console.log(`[${functionName}] Environment check - ELEVEN_LABS_API_KEY: ${Deno.env.get('ELEVEN_LABS_API_KEY') ? 'Present' : 'Missing'}`);
  } catch (error) {
    console.error(`[${functionName}] Error checking environment variables:`, error);
  }
  
  // Handle CORS preflight requests with explicit status 200
  if (req.method === 'OPTIONS') {
    console.log(`[${functionName}] Handling OPTIONS request`);
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  try {
    console.log(`[${functionName}] Processing ${req.method} request...`);
    
    const response = await handleHistorySyncRequest(req);
    const duration = Date.now() - startTime;
    console.log(`[${functionName}] Request completed in ${duration}ms with status ${response.status}`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${functionName}] Error handling request after ${duration}ms:`, error);
    
    // Add CORS headers to the error response
    return new Response(
      JSON.stringify({ 
        error: { 
          message: error instanceof Error ? error.message : String(error),
          code: "INTERNAL_SERVER_ERROR"
        } 
      }),
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
