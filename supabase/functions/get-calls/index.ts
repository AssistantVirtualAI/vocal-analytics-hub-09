
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handleGetCalls } from "./handlers.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return await handleGetCalls(req);
  } catch (error) {
    console.error("[get-calls INDEX] Unhandled error in main entry point:", error);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred.",
        message: error.message || "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
