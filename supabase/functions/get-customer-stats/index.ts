
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCorsOptions } from "../_shared/index.ts";
import { handleGetCustomerStats } from "./handlers.ts";

serve(async (req) => {
  console.log("[get-customer-stats] Edge function started");
  
  // Logging environment variable availability for debugging
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`[get-customer-stats] Environment check - SUPABASE_URL: ${supabaseUrl ? 'Present' : 'Missing'}`);
    console.log(`[get-customer-stats] Environment check - SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Present' : 'Missing'}`);
  } catch (envError) {
    console.error('[get-customer-stats] Error checking environment variables:', envError);
  }

  // Handle CORS preflight requests with explicit status 200
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }

  try {
    return await handleGetCustomerStats(req);
  } catch (error) {
    console.error("Unhandled error in get-customer-stats:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
