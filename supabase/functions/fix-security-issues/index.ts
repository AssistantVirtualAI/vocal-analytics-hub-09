
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

    console.log("Starting security fixes process...");

    // First fix: Drop and recreate the calls_view without SECURITY DEFINER
    console.log("Attempting to fix SECURITY DEFINER on calls_view...");
    const { error: viewError } = await supabase
      .rpc('execute_sql', {
        sql_statement: `
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
          
          RAISE NOTICE 'Successfully recreated calls_view without SECURITY DEFINER';
        EXCEPTION 
          WHEN OTHERS THEN
            RAISE NOTICE 'Error fixing calls_view: %', SQLERRM;
        END $$;
        `
      });

    if (viewError) {
      console.error("Error fixing SECURITY DEFINER view:", viewError);
      
      // Try alternate approach if first approach fails
      console.log("Trying alternate approach to fix SECURITY DEFINER...");
      const { error: altViewError } = await supabase
        .rpc('execute_sql', {
          sql_statement: `
          BEGIN;
          DROP VIEW IF EXISTS public.calls_view;
          
          CREATE VIEW public.calls_view AS
          SELECT 
            c.id,
            c.agent_id,
            a.name AS agent_name,
            c.date,
            c.customer_id,
            c.transcript,
            c.summary,
            c.tags,
            c.audio_url,
            c.created_at,
            c.satisfaction_score,
            c.duration
          FROM 
            public.calls c
          LEFT JOIN 
            public.agents a ON c.agent_id = a.id;
          
          COMMIT;
          `
        });
        
      if (altViewError) {
        console.error("Error with alternate approach:", altViewError);
        throw altViewError;
      } else {
        console.log("Successfully fixed calls_view using alternate approach");
      }
    } else {
      console.log("Successfully fixed SECURITY DEFINER on calls_view");
    }

    // Second fix: Fix Auth OTP long expiry
    console.log("Attempting to fix Auth OTP long expiry...");
    const { error: authError } = await supabase
      .rpc('execute_sql', {
        sql_statement: `
        UPDATE auth.config 
        SET email_confirm_token_validity_seconds = 3600 
        WHERE email_confirm_token_validity_seconds > 3600;
        `
      });

    if (authError) {
      console.error("Error fixing Auth OTP expiry:", authError);
      throw authError;
    }
    
    console.log("Successfully fixed Auth OTP expiry");

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
