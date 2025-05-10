
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsOptions, handleApiError } from "../_shared/api-utils.ts";
import { handleGetCall } from "./handlers.ts";

serve(async (req) => {
  const startTime = Date.now();
  const functionName = "get-call";

  // Gestion des requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    return await handleGetCall(req);
  } catch (error) {
    return await handleApiError(error, functionName, startTime);
  }
});
