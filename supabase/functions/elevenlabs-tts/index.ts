
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/index.ts";
import { fetchWithRetry } from "../_shared/index.ts";
import { safeGetEnv } from "../_shared/env.ts";

serve(async (req) => {
  console.log("[elevenlabs-tts] Edge function started");
  
  // Logging environment variable availability for debugging
  try {
    const elevenlabsKey1 = Deno.env.get('ELEVENLABS_API_KEY');
    const elevenlabsKey2 = Deno.env.get('ELEVEN_LABS_API_KEY');
    console.log(`[elevenlabs-tts] Environment check - ELEVENLABS_API_KEY: ${elevenlabsKey1 ? 'Present' : 'Missing'}`);
    console.log(`[elevenlabs-tts] Environment check - ELEVEN_LABS_API_KEY: ${elevenlabsKey2 ? 'Present' : 'Missing'}`);
  } catch (envError) {
    console.error('[elevenlabs-tts] Error checking environment variables:', envError);
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[elevenlabs-tts] Handling OPTIONS request with status 200');
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const elevenlabsApiKey = safeGetEnv('ELEVENLABS_API_KEY') || safeGetEnv('ELEVEN_LABS_API_KEY');
    if (!elevenlabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY environment variable is missing');
    }

    const defaultVoiceId = 'QNdB45Jpgh06Hr67TzFO'; // Using the provided agent ID as voice ID

    const response = await fetchWithRetry(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || defaultVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsApiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      },
      3 // Maximum 3 retries
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to generate speech');
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in elevenlabs-tts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
