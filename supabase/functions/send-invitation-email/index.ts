
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
    const { email, organizationName = "Votre organisation", invitationUrl } = requestData;
    
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
        from: "Invitations <noreply@assistantvirtualai.com>",
        to: [email],
        subject: `Invitation à rejoindre ${organizationName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Vous êtes invité à rejoindre ${organizationName}</h1>
            <p>Vous avez reçu une invitation pour rejoindre l'organisation "${organizationName}".</p>
            <p>Pour accepter cette invitation, veuillez cliquer sur le lien ci-dessous:</p>
            <a href="${invitationUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
              Accepter l'invitation
            </a>
            <p>Ce lien est valable pour 24 heures.</p>
            <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
          </div>
        `,
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
