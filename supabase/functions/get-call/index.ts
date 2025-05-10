
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions } from "../_shared/api-utils.ts";
import { handleGetCall } from "./handlers.ts";

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    return await handleGetCall(req);
  } catch (error) {
    console.error('Unhandled error in get-call function:', error);
    return new Response(JSON.stringify({ 
      error: {
        message: error.message || "Une erreur inattendue s'est produite",
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
