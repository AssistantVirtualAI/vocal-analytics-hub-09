
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { callId } = body;

    if (!callId) {
      throw new Error('Call ID is required');
    }

    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }

    console.log(`Fetching call audio for call ID: ${callId}`);
    
    // Get call details to retrieve the audio URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the call to get the audio_url
    const { data: call, error: callError } = await supabase
      .from('calls_view')
      .select('audio_url, agent_id')
      .eq('id', callId)
      .single();

    if (callError) {
      console.error('Database error:', callError);
      throw new Error(`Failed to fetch call: ${callError.message}`);
    }

    if (!call || !call.audio_url) {
      throw new Error('Call not found or no audio URL available');
    }
    
    let audioUrl = call.audio_url;
    let transcript = '';
    let summary = '';
    let statistics = null;

    // Check if this is an ElevenLabs API URL
    if (audioUrl.includes('api.elevenlabs.io')) {
      // Call the ElevenLabs API with authentication
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
      
      // Update values from ElevenLabs API
      audioUrl = data.audio_url || audioUrl;
      transcript = data.transcript || "";
      summary = data.summary || "";
      
      // Extract statistics from ElevenLabs response
      if (data.statistics) {
        statistics = data.statistics;
        console.log("Received statistics from ElevenLabs:", JSON.stringify(statistics));
      } else {
        console.log("No statistics available in ElevenLabs response");
        
        // Try to fetch statistics separately if not included in the call data
        try {
          const statsResponse = await fetch(
            `https://api.elevenlabs.io/v1/calls/${callId}/statistics`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'xi-api-key': elevenlabsApiKey,
              },
            }
          );
          
          if (statsResponse.ok) {
            statistics = await statsResponse.json();
            console.log("Fetched statistics separately:", JSON.stringify(statistics));
          } else {
            console.log("Failed to fetch statistics separately:", statsResponse.status);
          }
        } catch (statsError) {
          console.error("Error fetching statistics:", statsError);
        }
      }

      console.log(`Received data from ElevenLabs API:
        - Audio URL: ${audioUrl.substring(0, 30)}...
        - Transcript: ${transcript.length} characters
        - Summary: ${summary.length} characters
        - Statistics: ${statistics ? 'Available' : 'Not available'}`);
      
      // Store the transcript and summary in the database
      if (transcript || summary) {
        const { error: updateError } = await supabase
          .from('calls')
          .update({
            transcript: transcript || null,
            summary: summary || null,
            elevenlabs_statistics: statistics
          })
          .eq('id', callId);
        
        if (updateError) {
          console.error('Error updating call with transcript/summary/statistics:', updateError);
        } else {
          console.log('Successfully updated call with transcript, summary, and statistics');
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        audioUrl,
        transcript,
        summary,
        statistics
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
