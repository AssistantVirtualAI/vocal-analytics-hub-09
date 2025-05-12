
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { ELEVENLABS_API_BASE_URL } from "../_shared/elevenlabs/client.ts";
import { safeGetEnv } from "../_shared/env.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Edge function get-call-audio called");

  const url = new URL(req.url);
  const historyId = url.searchParams.get("history_id");
  const elevenLabsApiKey = safeGetEnv("ELEVENLABS_API_KEY", true);

  // Validate required parameters
  if (!historyId) {
    console.error("Missing history_id parameter");
    return new Response(JSON.stringify({ error: "history_id is required" }), {
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!elevenLabsApiKey) {
    console.error("ElevenLabs API key not configured");
    return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(`Fetching audio for history item: ${historyId}`);
    const audioUrl = `${ELEVENLABS_API_BASE_URL}/history/${historyId}/audio`;
    const response = await fetch(audioUrl, {
      headers: { "xi-api-key": elevenLabsApiKey },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`ElevenLabs API error (${response.status}): ${errorBody}`);
      return new Response(JSON.stringify({ 
        error: `Failed to fetch audio from ElevenLabs: ${response.statusText}` 
      }), {
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Stream the audio content directly
    const audioHeaders = new Headers(corsHeaders);
    audioHeaders.set('Content-Type', response.headers.get('Content-Type') || 'audio/mpeg');
    audioHeaders.set('Content-Disposition', `attachment; filename="${historyId}.mp3"`);
    
    console.log(`Successfully fetched audio for history item: ${historyId}`);
    return new Response(response.body, { 
      headers: audioHeaders, 
      status: 200 
    });

  } catch (error) {
    console.error("Error fetching audio:", error);
    return new Response(JSON.stringify({ error: "Internal server error fetching audio" }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
