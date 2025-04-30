
import { Resend } from "npm:resend@2.0.0";
import { generateInvitationEmailTemplate } from "./emailTemplate.ts";
import { InvitationEmailRequest, EmailResponse } from "./types.ts";
import { formatError } from "./utils.ts";

/**
 * Sends invitation email using Resend API
 */
export async function sendInvitationEmail(
  requestData: InvitationEmailRequest
): Promise<{ response: Response }> {
  try {
    // Check if API key exists
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
      return {
        response: new Response(
          JSON.stringify({ 
            success: false, 
            error: {
              message: "RESEND_API_KEY is not configured",
              code: 500,
              name: "configuration_error"
            }
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      };
    }

    const resend = new Resend(apiKey);
    
    // Changed the default organization name to "AVA AI"
    const { email, organizationName = "AVA AI", invitationUrl } = requestData;
    
    console.log(`Sending email to: ${email}, organizationName: ${organizationName}`);
    
    if (!email || !invitationUrl) {
      console.error("Missing required parameters:", { email, invitationUrl });
      return {
        response: new Response(
          JSON.stringify({ 
            success: false,
            error: {
              message: "Missing required parameters: email or invitationUrl",
              code: 400,
              name: "validation_error"
            }
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      };
    }

    console.log(`Invitation URL: ${invitationUrl}`);
    
    // Generate the HTML template
    const htmlContent = generateInvitationEmailTemplate(organizationName, invitationUrl);

    try {
      const emailResponse = await resend.emails.send({
        from: "Invitations <aiagent@assistantvirtualai.com>",
        to: [email],
        subject: `Invitation à rejoindre ${organizationName}`,
        html: htmlContent,
      });

      console.log("Email response:", emailResponse);

      // Handle errors from Resend API
      if (emailResponse.error) {
        console.error("Resend API error:", emailResponse.error);
        
        return {
          response: new Response(
            JSON.stringify({
              success: false,
              error: {
                message: emailResponse.error.message || "Unknown error",
                code: emailResponse.error.statusCode || 500,
                name: emailResponse.error.name || "error"
              }
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          )
        };
      }

      return {
        response: new Response(
          JSON.stringify({ 
            success: true, 
            data: emailResponse 
          }), 
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      };
    } catch (emailError: any) {
      // Handle Resend API errors
      console.error("Resend API error:", emailError);
      
      return {
        response: new Response(
          JSON.stringify({
            success: false,
            error: {
              message: emailError.message || "Unknown error sending email",
              code: emailError.statusCode || 500,
              name: emailError.name || "error"
            }
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      };
    }
  } catch (error: any) {
    return formatError(error);
  }
}
