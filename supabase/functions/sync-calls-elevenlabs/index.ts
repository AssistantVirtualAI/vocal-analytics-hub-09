
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleSyncRequest, handleCorsOptions } from "./handlers.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  // Handle the sync request
  return handleSyncRequest(req);
});
