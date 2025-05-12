
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions } from "../_shared/index.ts";
import { handleMonitorRequest } from "./handlers.ts";

serve(async (req) => {
  // Gestion des requêtes CORS preflight avec status 200 explicite
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }
  
  try {
    return await handleMonitorRequest(req);
  } catch (error) {
    console.error('Unhandled error in api-monitor function:', error);
    return new Response(JSON.stringify({ 
      error: {
        message: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
        code: "INTERNAL_SERVER_ERROR"
      }
    }), {
      status: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json'
      },
    });
  }
});
