
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  organizationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Supabase native invitation function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing Supabase credentials" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with the service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestData: InvitationRequest = await req.json();
    const { email, organizationId } = requestData;
    
    console.log(`Received invitation request for email: ${email}, organizationId: ${organizationId}`);
    
    if (!email) {
      console.error("Missing required parameter: email");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameter: email" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate a custom redirect URL that includes the organization ID
    // This will allow us to associate the user with the organization after signup
    const redirectTo = `${Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:3000"}/auth?invitation=true&organizationId=${organizationId}`;
    
    console.log(`Sending Supabase invitation to ${email} with redirect: ${redirectTo}`);

    // Use the Supabase admin API to send an invitation email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo
    });

    if (error) {
      console.error("Error sending Supabase invitation:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-supabase-invitation function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: typeof error === 'object' ? 
          (error.message || JSON.stringify(error)) : 
          String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
