
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest } from "./handlers.ts";
import { corsHeaders } from "./utils.ts";

// Main entry point for the edge function
serve(async (req) => {
  console.log("[get-stats] Edge function started");
  
  // Check for environment variables
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log(`[get-stats] Environment check - SUPABASE_URL: ${supabaseUrl ? 'Present' : 'Missing'}`);
    console.log(`[get-stats] Environment check - SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Present' : 'Missing'}`);
  } catch (envError) {
    console.error('[get-stats] Error checking environment variables:', envError);
  }
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[get-stats] Handling OPTIONS request with status 200');
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Process the request through our handler
    console.log('[get-stats] Processing request');
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
