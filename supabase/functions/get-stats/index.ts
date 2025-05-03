
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest } from "./handlers.ts";
import { corsHeaders } from "./utils.ts";

// Main entry point for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Process the request through our handler
    return await handleRequest(req);
  } catch (error) {
    console.error('Unhandled error in get-stats function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
