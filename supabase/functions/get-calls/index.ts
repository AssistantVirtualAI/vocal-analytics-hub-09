
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCorsOptions } from "../_shared/index.ts";
import { handleGetCalls } from "./handlers.ts";
import { createErrorResponse } from "./response-factory.ts";
import { logError } from "../_shared/agent-resolver/logger.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    return await handleGetCalls(req);
  } catch (error) {
    logError(`Unhandled error in main entry point: ${error instanceof Error ? error.message : String(error)}`);
    return createErrorResponse(error);
  }
});
