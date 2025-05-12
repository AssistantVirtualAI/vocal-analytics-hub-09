
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions, handleApiError } from "../_shared/api-utils.ts";
import { handleGetCall } from "./handlers.ts";

serve(async (req) => {
  const startTime = Date.now();
  const functionName = "get-call";

  // Gestion des requêtes CORS preflight avec status 200 explicite
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      }
    });
  }

  try {
    return await handleGetCall(req);
  } catch (error) {
    return await handleApiError(error, functionName, startTime);
  }
});
