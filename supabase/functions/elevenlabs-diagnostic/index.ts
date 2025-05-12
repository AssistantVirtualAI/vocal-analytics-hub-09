
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting ElevenLabs diagnostics");
    
    // 1. Check available environment variables
    const availableEnvVars = [];
    const envVarsToCheck = [
      "ELEVENLABS_API_KEY", 
      "ELEVEN_LABS_API_KEY", 
      "SUPABASE_URL", 
      "SUPABASE_SERVICE_ROLE_KEY"
    ];
    
    for (const envVar of envVarsToCheck) {
      const value = Deno.env.get(envVar);
      if (value !== undefined) {
        // Don't log the actual value, just that it exists
        const maskedValue = value 
          ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}`
          : "empty string";
        console.log(`${envVar} is set: ${maskedValue}`);
        availableEnvVars.push(envVar);
      } else {
        console.log(`${envVar} is NOT set`);
      }
    }
    
    // 2. Check for the API key specifically
    let apiKeyStatus = "missing";
    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") || Deno.env.get("ELEVEN_LABS_API_KEY");
    
    if (elevenLabsApiKey) {
      apiKeyStatus = "present";
      console.log("ElevenLabs API key is present");
    } else {
      console.log("ElevenLabs API key is missing");
    }
    
    return new Response(
      JSON.stringify({
        status: "OK",
        message: "ElevenLabs diagnostics completed",
        availableEnvVars,
        apiKeyStatus,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error running ElevenLabs diagnostics:", error);
    
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
