
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { callId } = await req.json();

    if (!callId) {
      throw new Error('Call ID is required');
    }

    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }

    // Call the ElevenLabs API to get the audio recording
    const response = await fetch(
      `https://api.elevenlabs.io/v1/calls/${callId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': elevenlabsApiKey,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ElevenLabs API error:', errorData);
      throw new Error(errorData.detail?.message || `Failed to get call recording: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        audioUrl: data.audio_url,
        transcript: data.transcript,
        summary: data.summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in elevenlabs-call-audio function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
