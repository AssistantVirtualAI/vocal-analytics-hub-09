
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions } from "../_shared/api-utils.ts";
import { handleHistorySyncRequest } from "./handlers.ts";

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
    const response = await handleHistorySyncRequest(req);
    const duration = Date.now() - startTime;
    console.log(`[${functionName}] Request completed in ${duration}ms with status ${response.status}`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${functionName}] Error handling request after ${duration}ms:`, error);
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
          ...Object.fromEntries(Object.entries(req.headers).filter(([key]) => 
            key.toLowerCase().startsWith('access-control-')
          ))
        }
      }
    );
  }
});
