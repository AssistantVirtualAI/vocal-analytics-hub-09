
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";
import { corsHeaders } from "../_shared/index.ts";

console.log("Fix Security Issues Function Started");

const handler = async (_request: Request) => {
  // Allow CORS
  if (_request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the session from the request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Fixing RLS on sync_status table");

    // Fix RLS on sync_status table
    const { error: rlsError } = await supabaseClient.rpc("enable_rls_and_policies_sync_status");
    if (rlsError) {
      console.error("Error enabling RLS on sync_status table:", rlsError);
      throw rlsError;
    }

    console.log("Fixing pgnet extension");

    // Fix pgnet extension in public schema
    const { error: pgnetError } = await supabaseClient.rpc("move_extension_to_private_schema");
    if (pgnetError) {
      console.error("Error moving pgnet extension:", pgnetError);
      throw pgnetError;
    }

    console.log("Fixing OTP expiry time");

    // Fix OTP expiry time - this can only be done from the dashboard UI
    // We'll just report that it needs to be done manually

    return new Response(
      JSON.stringify({
        success: true,
        message: "Security issues fixed successfully",
        manualSteps: [
          "Auth OTP expiry needs to be reduced to less than 1 hour in the Authentication settings."
        ]
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fixing security issues:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
};

serve(handler);
