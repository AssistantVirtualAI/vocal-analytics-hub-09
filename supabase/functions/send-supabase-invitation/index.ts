
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
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

    if (!resendApiKey) {
      console.error("Missing Resend API key");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Configuration Resend incomplète" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with the service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    let requestData: InvitationRequest;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
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

    // Get organization name
    let organizationName = "AVA AI";
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();
      
      if (!orgError && orgData) {
        organizationName = orgData.name;
      }
    } catch (orgError) {
      console.error("Error fetching organization name:", orgError);
      // Continue with default organization name
    }

    // Get the invitation URL from Supabase data or build from redirect
    const invitationUrl = data?.properties?.action_link || redirectTo;
    
    // Send custom email using Resend
    try {
      const resend = new Resend(resendApiKey);
      
      await resend.emails.send({
        from: `Invitations <notifications@assistantvirtualai.com>`,
        to: [email],
        subject: `Invitation à rejoindre ${organizationName}`,
        html: `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <title>Vous avez été invité – AVA AI Dashboard</title>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .logo { text-align: center; margin-bottom: 20px; }
              .logo img { display: block; margin: 0 auto; max-width: 150px; height: auto; }
              h2 { color: #333; text-align: center; margin-bottom: 10px; }
              .intro { color: #555; line-height: 1.5; margin-bottom: 20px; }
              .features { background: #f9f9f9; border-left: 4px solid #007bff; padding: 10px 15px; margin-bottom: 20px; }
              .features h3 { margin-top: 0; color: #007bff; }
              .features ul { padding-left: 20px; }
              .button { display: block; width: 240px; margin: 30px auto; padding: 15px; text-align: center; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
              .footer a { color: #007bff; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <!-- Logo AVA AI inline en base64 -->
                <img src="data:image/webp;base64,UklGRo4IAABXRUJQVlA4WAoAAABQBwCdASoU...8pNVYL8TbvgJ35SnH+/z78A2uHxEfKWv8pEAAAAAA=" alt="Logo AVA AI" />
              </div>

              <h2>Vous avez été invité !</h2>

              <p class="intro">
                Vous avez été invité à créer un compte utilisateur sur <strong>${organizationName}</strong>.
                Cliquez sur le bouton ci-dessous pour accepter l'invitation et configurer votre profil.
              </p>

              <div class="features">
                <h3>Pourquoi AVA AI Dashboard ?</h3>
                <ul>
                  <li>Accéder à des insights et analyses en temps réel</li>
                  <li>Personnaliser les préférences de votre assistant virtuel</li>
                  <li>Suivre les données historiques et tendances d'utilisation</li>
                  <li>Recevoir des recommandations et alertes personnalisées</li>
                </ul>
              </div>

              <a href="${invitationUrl}" class="button">Accepter l'invitation</a>

              <p class="intro">
                Si vous n'attendiez pas cette invitation, veuillez ignorer cet e-mail.
              </p>

              <div class="footer">
                <p>&copy; 2025 AVA AI. Tous droits réservés.</p>
                <p>Cet e-mail est généré par AVA Groupe 2025.
                Tous droits réservés à Assistant Virtual AI Automation INC.</p>
                <p>Contactez-nous : <a href="mailto:aiagent@assistantvirtualai.com">aiagent@assistantvirtualai.com</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      });
      
      console.log("Custom email sent successfully");
      
    } catch (emailError: any) {
      console.error("Error sending custom email:", emailError);
      // Don't fail the request if custom email fails, as Supabase already sent its email
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
