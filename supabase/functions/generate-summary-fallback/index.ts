
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request
    const reqBody = await req.json();
    const { callId, transcript } = reqBody;

    if (!callId) {
      throw new Error('Call ID is required');
    }

    if (!transcript) {
      throw new Error('Transcript is required to generate summary');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    console.log(`Generating fallback summary for call ID: ${callId}`);

    // Call the OpenAI API to generate a summary
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui résume les transcriptions d\'appels téléphoniques de manière concise et professionnelle.'
          },
          {
            role: 'user',
            content: `Crée un résumé concis de la transcription d'appel suivante. Concentre-toi sur les points clés, les actions à entreprendre et les décisions importantes:\n\n${transcript}`
          }
        ],
        max_tokens: 250,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const summary = openaiData.choices[0].message.content;

    console.log(`Generated fallback summary (${summary.length} chars) for call ID: ${callId}`);

    // Update the call record with the generated summary
    const { error: updateError } = await supabase
      .from('calls')
      .update({ summary })
      .eq('id', callId);

    if (updateError) {
      throw new Error(`Failed to update call summary: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ summary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-summary-fallback function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
