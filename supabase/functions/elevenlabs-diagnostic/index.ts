
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple diagnostic check - just see if we can run a basic function
    const envKeys = Object.keys(Deno.env.toObject())
      .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN'));
    
    return new Response(
      JSON.stringify({ 
        status: "OK", 
        message: "Basic diagnostic function is working", 
        availableEnvVars: envKeys,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in basic diagnostic:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
