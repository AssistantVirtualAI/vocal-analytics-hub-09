
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handleGetCalls } from "./handlers.ts";
import { createErrorResponse } from "./response-factory.ts";
import { logError } from "../_shared/agent-resolver/logger.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return await handleGetCalls(req);
  } catch (error) {
    logError(`Unhandled error in main entry point: ${error instanceof Error ? error.message : String(error)}`);
    return createErrorResponse(error);
  }
});
