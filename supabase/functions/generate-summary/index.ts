
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // For now, we'll create a simple summary from the transcript
    // In a real application, you'd use an AI service like OpenAI to generate this
    const transcript = existingCall.transcript;
    const simpleSummary = `Summary of call: ${transcript.substring(0, 100)}...`;

    // Update the call with the new summary
    const { error: updateError } = await supabase
      .from("calls")
      .update({ summary: simpleSummary })
      .eq("id", callId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      summary: simpleSummary,
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
