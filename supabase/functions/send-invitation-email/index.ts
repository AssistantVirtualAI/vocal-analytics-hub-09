
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  organizationName?: string;
  invitationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Invitation email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key exists
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RESEND_API_KEY is not configured" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(apiKey);
    
    const requestData: InvitationEmailRequest = await req.json();
    // Changed the default organization name to "AVA AI"
    const { email, organizationName = "AVA AI", invitationUrl } = requestData;
    
    console.log(`Received request with email: ${email}, organizationName: ${organizationName}`);
    
    if (!email || !invitationUrl) {
      console.error("Missing required parameters:", { email, invitationUrl });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters: email or invitationUrl" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending invitation email to ${email} for organization ${organizationName}`);
    console.log(`Invitation URL: ${invitationUrl}`);

    try {
      const emailResponse = await resend.emails.send({
        from: "Invitations <aiagent@assistantvirtualai.com>",
        to: [email],
        subject: `Invitation à rejoindre ${organizationName}`,
        html: `<!DOCTYPE html>
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
</html>`,
      });

      console.log("Email response:", emailResponse);

      // Handle errors from Resend API
      if (emailResponse.error) {
        console.error("Resend API error:", emailResponse.error);
        
        // Format the error for the client side
        const errorObj = {
          success: false,
          error: {
            message: emailResponse.error.message || "Unknown error",
            code: emailResponse.error.statusCode || 500,
            name: emailResponse.error.name || "error"
          }
        };
        
        return new Response(
          JSON.stringify(errorObj),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: emailResponse 
        }), 
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (emailError: any) {
      // Handle Resend API errors
      console.error("Resend API error:", emailError);
      
      // Format the error consistently
      const errorObj = {
        success: false,
        error: {
          message: emailError.message || "Unknown error sending email",
          code: emailError.statusCode || 500,
          name: emailError.name || "error"
        }
      };
      
      return new Response(
        JSON.stringify(errorObj),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    
    // Ensure consistent error format
    const errorObj = {
      success: false,
      error: {
        message: typeof error === 'object' ? 
          (error.message || JSON.stringify(error)) : 
          String(error),
        code: 500,
        name: "internal_error"
      }
    };
    
    return new Response(
      JSON.stringify(errorObj),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
