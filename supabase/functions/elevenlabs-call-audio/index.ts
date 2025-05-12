
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/index.ts";
import { handleRequest } from "./handlers.ts";

serve(async (req) => {
  console.log("[elevenlabs-call-audio] Edge function started");
  
  // Logging environment variable availability for debugging
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const elevenlabsKey1 = Deno.env.get('ELEVENLABS_API_KEY');
    const elevenlabsKey2 = Deno.env.get('ELEVEN_LABS_API_KEY');
    
    console.log(`[elevenlabs-call-audio] Environment check - SUPABASE_URL: ${supabaseUrl ? 'Present' : 'Missing'}`);
    console.log(`[elevenlabs-call-audio] Environment check - SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Present' : 'Missing'}`);
    console.log(`[elevenlabs-call-audio] Environment check - ELEVENLABS_API_KEY: ${elevenlabsKey1 ? 'Present' : 'Missing'}`);
    console.log(`[elevenlabs-call-audio] Environment check - ELEVEN_LABS_API_KEY: ${elevenlabsKey2 ? 'Present' : 'Missing'}`);
  } catch (envError) {
    console.error('[elevenlabs-call-audio] Error checking environment variables:', envError);
  }

  // Handle CORS preflight requests with explicit status 200
  if (req.method === "OPTIONS") {
    console.log('[elevenlabs-call-audio] Handling OPTIONS request with status 200');
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Unhandled error in elevenlabs-call-audio:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "An unexpected error occurred",
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
