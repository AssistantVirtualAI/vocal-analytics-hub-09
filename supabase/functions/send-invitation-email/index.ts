
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { generateInvitationEmailTemplate } from './emailTemplate.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with the service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface EmailPayload {
  email: string;
  organizationId: string;
  organizationName?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const payload: EmailPayload = await req.json();
    const { email, organizationId, organizationName } = payload;

    if (!email || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Email and organizationId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the organization name if not provided
    let orgName = organizationName;
    if (!orgName) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();
      
      if (orgError || !orgData) {
        console.error('Error fetching organization:', orgError);
        return new Response(
          JSON.stringify({ error: 'Organization not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      orgName = orgData.name;
    }

    // Get invitation token
    const { data: invitationData, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('token, expires_at')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (invitationError || !invitationData?.token) {
      console.error('Error fetching invitation:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
      );
    }

    // Generate invitation URL
    const token = invitationData.token;
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:5173';
    const invitationUrl = `${baseUrl}/auth?invitation_token=${token}&email=${encodeURIComponent(email)}`;

    // Generate email content
    const emailHtml = generateInvitationEmailTemplate(orgName, invitationUrl);
    const emailSubject = `Invitation à rejoindre ${orgName}`;

    // Send email using Supabase's email service
    const { error: mailError } = await supabase.auth.admin.sendEmail(
      email,
      {
        type: 'invite',
        subject: emailSubject,
        template_data: { url: invitationUrl, site_name: orgName },
        email_html: emailHtml,
      }
    );

    if (mailError) {
      console.error('Error sending email:', mailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send invitation email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Invitation email sent successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
