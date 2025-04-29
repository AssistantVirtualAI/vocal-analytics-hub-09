
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  organizationId?: string;
  token?: string;
  organizationName?: string;
  invitationUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: InvitationEmailRequest = await req.json();
    const { email } = requestData;
    
    // Support both parameter formats for backward compatibility
    const organizationName = requestData.organizationName || "Votre organisation";
    let invitationUrl;
    
    if (requestData.invitationUrl) {
      invitationUrl = requestData.invitationUrl;
    } else if (requestData.token && requestData.organizationId) {
      // Construct URL from token and organizationId for backward compatibility
      invitationUrl = `${new URL(req.url).origin}/auth?invitation=${requestData.token}`;
    } else {
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameters: invitationUrl or (token and organizationId)" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required parameter: email" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending invitation email to ${email} for organization ${organizationName}`);
    console.log(`Invitation URL: ${invitationUrl}`);

    const emailResponse = await resend.emails.send({
      from: "Invitations <onboarding@resend.dev>",
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
