
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleHistorySyncRequest } from "./handlers.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Handle the sync request
  return handleHistorySyncRequest(req);
});
