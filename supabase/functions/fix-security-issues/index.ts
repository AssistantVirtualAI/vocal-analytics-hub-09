
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the original view definition to preserve it
    const { data: viewData, error: viewError } = await supabase
      .rpc('get_view_definition', { view_name: 'calls_view' });

    if (viewError) throw viewError;

    const viewDefinition = viewData;

    // Drop the existing view
    const { error: dropError } = await supabase
      .rpc('execute_sql', { sql_statement: 'DROP VIEW IF EXISTS public.calls_view;' });

    if (dropError) throw dropError;

    // Recreate the view without SECURITY DEFINER (using SECURITY INVOKER by default)
    const { error: createError } = await supabase
      .rpc('execute_sql', { sql_statement: viewDefinition.replace('SECURITY DEFINER', '') });

    if (createError) throw createError;

    // Fix Auth OTP long expiry
    const { error: authError } = await supabase
      .rpc('execute_sql', { 
        sql_statement: `
        UPDATE auth.config 
        SET email_confirm_token_validity_seconds = 3600 
        WHERE email_confirm_token_validity_seconds > 3600;
        `
      });

    if (authError) throw authError;

    return new Response(JSON.stringify({
      success: true, 
      message: "Security issues fixed: public.calls_view has been recreated with SECURITY INVOKER, and Auth OTP expiry has been set to 1 hour."
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fixing security issues:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
