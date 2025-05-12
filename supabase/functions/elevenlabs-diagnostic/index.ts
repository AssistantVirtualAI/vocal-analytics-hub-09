
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ELEVENLABS_API_KEY = "sk_cb80f1b637b2780c72a39fd600883800050703088fb83dc4";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting ElevenLabs diagnostics");
    
    // 1. Manually set the API key and check environment variables
    const availableEnvVars = [];
    const envVarsToCheck = [
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
    let apiKeyStatus = "present";
    console.log("Hardcoded ElevenLabs API key is present");
    
    // Try to make a simple API call to verify the key works
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        }
      });
      
      if (response.ok) {
        apiKeyStatus = "verified";
        console.log("ElevenLabs API key is verified and working");
      } else {
        apiKeyStatus = "invalid";
        console.log("ElevenLabs API key is invalid:", response.status);
      }
    } catch (apiError) {
      console.error("Error testing API key:", apiError);
      apiKeyStatus = "error_testing";
    }
    
    return new Response(
      JSON.stringify({
        status: "OK",
        message: "ElevenLabs diagnostics completed",
        availableEnvVars,
        apiKeyStatus,
        elevenlabsApiKey: "hardcoded",
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
