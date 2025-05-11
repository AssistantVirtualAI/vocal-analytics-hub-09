
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { safeGetEnv } from "../_shared/env.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting ElevenLabs API test");
    
    // Check if we can access the API key
    const apiKey = safeGetEnv('ELEVENLABS_API_KEY') || safeGetEnv('ELEVEN_LABS_API_KEY');
    
    if (!apiKey) {
      throw new Error("ElevenLabs API key not found in environment variables");
    }
    
    console.log("API key found (masked):", apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3));
    
    // Try a simple request to ElevenLabs API
    console.log("Making test request to ElevenLabs API");
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });
    
    console.log("ElevenLabs API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }
    
    // Get just enough information to verify the API is working
    const data = await response.json();
    const subscription = data.subscription || {};
    
    return new Response(
      JSON.stringify({
        status: "OK",
        message: "Successfully connected to ElevenLabs API",
        apiStatus: response.status,
        subscriptionTier: subscription.tier || "unknown",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error testing ElevenLabs API:", error);
    
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
