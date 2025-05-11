
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions } from "../_shared/api-utils.ts";
import { handleHistorySyncRequest } from "./handlers.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const startTime = Date.now();
  const functionName = "sync-elevenlabs-history";
  
  console.log(`[${functionName}] Request received: ${req.method} ${req.url}`);
  
  // Gestion des requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${functionName}] Handling OPTIONS request`);
    return handleCorsOptions();
  }
  
  try {
    console.log(`[${functionName}] Processing ${req.method} request...`);
    
    // Log environment variable availability
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') || Deno.env.get('ELEVEN_LABS_API_KEY');
    
    console.log(`[${functionName}] Environment variables status:
      - SUPABASE_URL: ${supabaseUrl ? 'Available' : 'Missing'}
      - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Available' : 'Missing'}
      - ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY: ${elevenlabsApiKey ? 'Available' : 'Missing'}
    `);
    
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
