
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'This endpoint requires a POST request' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Parse the request body
  let requestData;
  try {
    requestData = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { callId } = requestData;
  if (!callId) {
    return new Response(JSON.stringify({ error: 'Call ID is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

  try {
    // First check if we already have a summary
    const { data: existingCall, error: fetchError } = await supabase
      .from("calls")
      .select("id, summary, transcript")
      .eq("id", callId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existingCall) {
      return new Response(JSON.stringify({ error: 'Call not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we already have a summary, return it
    if (existingCall.summary) {
      return new Response(JSON.stringify({ 
        summary: existingCall.summary,
        isExisting: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we don't have a transcript, we can't generate a summary
    if (!existingCall.transcript) {
      return new Response(JSON.stringify({ 
        error: 'No transcript available to generate summary' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate summary using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that summarizes phone calls. Provide a clear, concise summary focused on the key points, action items, and any important decisions or agreements made during the call.'
          },
          {
            role: 'user',
            content: `Please summarize this call transcript:\n\n${existingCall.transcript}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate summary');
    }

    const openAIResponse = await response.json();
    const generatedSummary = openAIResponse.choices[0].message.content;

    // Update the call with the new summary
    const { error: updateError } = await supabase
      .from("calls")
      .update({ summary: generatedSummary })
      .eq("id", callId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      summary: generatedSummary,
      isExisting: false
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-summary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
