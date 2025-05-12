
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { getSupabaseEnvVars } from '../_shared/env.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/response.ts';
import { handleCorsOptions } from '../_shared/cors-utils.ts';

interface EmailPayload {
  email: string;
  organizationId: string;
  organizationName?: string;
}

serve(async (req) => {
  // Handle CORS preflight request with explicit status 200
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Parse the request body
    const payload: EmailPayload = await req.json();
    const { email, organizationId, organizationName } = payload;

    if (!email || !organizationId) {
      return createErrorResponse({
        status: 400,
        message: 'Email and organizationId are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    console.log(`Processing invitation for email: ${email} and org: ${organizationId}`);

    try {
      const { supabaseUrl, supabaseServiceKey } = getSupabaseEnvVars();
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          return createErrorResponse({
            status: 404,
            message: 'Organization not found',
            code: 'NOT_FOUND'
          });
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
        return createErrorResponse({
          status: 404,
          message: 'Invitation not found',
          code: 'INVITATION_NOT_FOUND'
        });
      }

      // Generate invitation URL
      const token = invitationData.token;
      const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:5173';
      const invitationUrl = `${baseUrl}/auth?invitation_token=${token}&email=${encodeURIComponent(email)}`;

      console.log(`Generated invitation URL with token: ${token.substring(0, 8)}...`);
      console.log(`Using base URL: ${baseUrl}`);

      // Send email using Supabase's auth.admin.inviteUserByEmail
      // This will use Supabase's email templates configured in the dashboard
      const { error: mailError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: invitationUrl,
        data: {
          organization_id: organizationId,
          organization_name: orgName,
        }
      });

      if (mailError) {
        console.error('Error sending email:', mailError);
        return createErrorResponse({
          status: 500,
          message: 'Failed to send invitation email',
          code: 'MAIL_ERROR',
          details: mailError.message
        });
      }

      console.log(`Successfully sent invitation email to ${email}`);

      // Return success response
      return createSuccessResponse({ 
        success: true, 
        message: 'Invitation email sent successfully' 
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('environment variable')) {
        return createErrorResponse({
          status: 500,
          message: error.message,
          code: "MISSING_ENV_VAR"
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error processing invitation:', error);
    return createErrorResponse({
      status: 500,
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
