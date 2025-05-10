
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

    // First fix: Drop and recreate the calls_view without SECURITY DEFINER
    const { error: viewError } = await supabase
      .from('_sqlQueries')
      .select('*')
      .eq('id', 'fix_security_definer_view')
      .maybeSingle()
      .execute(
        `
        -- First get the original view definition
        DO $$
        DECLARE
          view_def text;
        BEGIN
          -- Get the view definition
          SELECT pg_get_viewdef('public.calls_view'::regclass, true) INTO view_def;
          
          -- Drop the existing view
          EXECUTE 'DROP VIEW IF EXISTS public.calls_view;';
          
          -- Recreate the view without SECURITY DEFINER (using SECURITY INVOKER by default)
          EXECUTE 'CREATE VIEW public.calls_view AS ' || view_def;
        END $$;
        `
      );

    if (viewError) throw viewError;

    // Second fix: Fix Auth OTP long expiry
    const { error: authError } = await supabase
      .from('_sqlQueries')
      .select('*')
      .eq('id', 'fix_auth_otp_expiry')
      .maybeSingle()
      .execute(`
        UPDATE auth.config 
        SET email_confirm_token_validity_seconds = 3600 
        WHERE email_confirm_token_validity_seconds > 3600;
      `);

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
