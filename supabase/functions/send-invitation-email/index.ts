
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendInvitationEmail } from "./emailService.ts";
import { corsHeaders } from "./utils.ts";
import { formatError } from "./utils.ts";
import { InvitationEmailRequest } from "./types.ts";

const handler = async (req: Request): Promise<Response> => {
  console.log("Invitation email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: InvitationEmailRequest = await req.json();
    
    // Add cors headers to the response from sendInvitationEmail
    const { response } = await sendInvitationEmail(requestData);
    
    // Create a new response with the same body but with CORS headers
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        ...corsHeaders
      }
    });
  } catch (error: any) {
    const { response } = formatError(error);
    
    // Add CORS headers
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        ...corsHeaders
      }
    });
  }
};

serve(handler);
