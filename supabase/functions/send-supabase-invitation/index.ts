import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with the service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Custom HTML templates for Supabase Auth
const confirmSignupHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Confirmez votre inscription - AVA AI Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo img { display: block; margin: 0 auto; max-width: 150px; height: auto; }
    h2 { color: #333; text-align: center; margin-bottom: 10px; }
    .intro { color: #555; line-height: 1.5; margin-bottom: 20px; }
    .features { background: #f9f9f9; border-left: 4px solid #007bff; padding: 10px 15px; margin-bottom: 20px; }
    .features h3 { margin-top: 0; color: #007bff; }
    .button { display: block; width: 240px; margin: 30px auto; padding: 15px; text-align: center; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
    .footer a { color: #007bff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <!-- Logo inline en base64 pour éviter les blocages d'images externes -->
      <img src="data:image/webp;base64,UklGRo4IAABXRUJQVlA4WAoAAABQBwCdASoU...8pNVYL8TbvgJ35SnH+/z78A2uHxEfKWv8pEAAAAAA=" alt="AVA AI Logo" />
    </div>

    <h2>Bienvenue sur AVA AI Dashboard !</h2>
    <p class="intro">
      Vous venez de rejoindre la plateforme AVA AI, votre portail centralisé pour gérer vos interactions intelligentes.
      Avant de commencer, confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous.
    </p>

    <div class="features">
      <h3>Ce que vous pouvez faire :</h3>
      <ul>
        <li>Consulter vos statistiques d'usage en temps réel</li>
        <li>Configurer vos préférences d'assistant virtuel</li>
        <li>Accéder à des rapports détaillés et historiques</li>
        <li>Recevoir des recommandations personnalisées</li>
      </ul>
    </div>

    <a href="{{ .ConfirmationURL }}" class="button">Confirmer mon e-mail</a>

    <p class="intro">Si vous n'avez pas créé ce compte, ignorez simplement cet e-mail.</p>

    <div class="footer">
      <p>&copy; 2025 AVA AI. Tous droits réservés.</p>
      <p>This email is generated from AVA Groupe 2025. Tous droits sont réservés à Assistant Virtual AI Automation INC.</p>
      <p>Contactez-nous : <a href="mailto:aiagent@assistantvirtualai.com">aiagent@assistantvirtualai.com</a></p>
    </div>
  </div>
</body>
</html>
`;

const confirmEmailChangeHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Confirmation de changement d'email – AVA AI Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo img { display: block; margin: 0 auto; max-width: 150px; height: auto; }
    h2 { color: #333; text-align: center; margin-bottom: 10px; }
    .intro { color: #555; line-height: 1.5; margin-bottom: 20px; }
    .button { display: block; width: 240px; margin: 30px auto; padding: 15px; text-align: center; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
    .footer a { color: #007bff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="data:image/webp;base64,UklGRo4IAABXRUJQVlA4WAoAAABQBwCdASoU...8pNVYL8TbvgJ35SnH+/z78A2uHxEfKWv8pEAAAAAA=" alt="AVA AI Logo" />
    </div>
    <h2>Confirmation de changement d'email</h2>
    <p class="intro">
      Pour confirmer la mise à jour de votre adresse e-mail de <strong>{{ .Email }}</strong> à <strong>{{ .NewEmail }}</strong>, cliquez sur le bouton ci-dessous :
    </p>
    <a href="{{ .ConfirmationURL }}" class="button">Confirmer l'email</a>
    <p class="intro">
      Si vous n'avez pas demandé ce changement, ignorez simplement cet e-mail ou contactez-nous pour assistance.
    </p>
    <div class="footer">
      <p>&copy; 2025 AVA AI. Tous droits réservés.</p>
      <p>Cet e-mail est généré par AVA Groupe 2025. Tous droits réservés à Assistant Virtual AI Automation INC.</p>
      <p>Contactez-nous : <a href="mailto:aiagent@assistantvirtualai.com">aiagent@assistantvirtualai.com</a></p>
    </div>
  </div>
</body>
</html>
`;

const resetPasswordHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Réinitialisation de mot de passe – AVA AI Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo img { display: block; margin: 0 auto; max-width: 150px; height: auto; }
    h2 { color: #333; text-align: center; margin-bottom: 10px; }
    .intro { color: #555; line-height: 1.5; margin-bottom: 20px; }
    .button { display: block; width: 240px; margin: 30px auto; padding: 15px; text-align: center; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
    .footer a { color: #007bff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="data:image/webp;base64,UklGRo4IAABXRUJQVlA4WAoAAABQBwCdASoU...8pNVYL8TbvgJ35SnH+/z78A2uHxEfKWv8pEAAAAAA=" alt="AVA AI Logo" />
    </div>
    <h2>Réinitialisation de mot de passe</h2>
    <p class="intro">
      Vous avez demandé à réinitialiser votre mot de passe pour votre compte utilisateur.
      Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
    </p>
    <a href="{{ .ConfirmationURL }}" class="button">Réinitialiser le mot de passe</a>
    <p class="intro">
      Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet e-mail ou contactez-nous.
    </p>
    <div class="footer">
      <p>&copy; 2025 AVA AI. Tous droits réservés.</p>
      <p>Cet e-mail est généré par AVA Groupe 2025. Tous droits réservés à Assistant Virtual AI Automation INC.</p>
      <p>Contactez-nous : <a href="mailto:aiagent@assistantvirtualai.com">aiagent@assistantvirtualai.com</a></p>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { email, organizationId } = payload;

    console.log(`Processing invitation request for email: ${email} and org: ${organizationId}`);

    if (!email || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Email and organizationId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the organization info
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      console.error('Error fetching organization:', orgError);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the invitation token
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .select('token')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (inviteError || !invitation) {
      console.error('Error fetching invitation:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the invitation URL
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:5173';
    const redirectTo = `${baseUrl}/auth?invitation_token=${invitation.token}&email=${encodeURIComponent(email)}`;

    console.log(`Generated redirection URL: ${redirectTo}`);
    
    // Explicitly log the email service attempt
    console.log(`Attempting to send invitation email to ${email}`);

    // Configure email templates for the supabase auth system to make sure they are set
    try {
      await supabase
        .auth
        .admin
        .updateAuthConfig({
          email_template_confirm_signup: confirmSignupHTML,
          email_template_change_email: confirmEmailChangeHTML,
          email_template_reset_password: resetPasswordHTML
        });
        
      console.log("Successfully updated email templates");
    } catch (templateError) {
      console.error("Error updating email templates:", templateError);
      // Continue even if this fails, as the default templates might work
    }

    // Send the invitation via Supabase auth
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo,
      data: {
        organization_id: organizationId,
        organization_name: organization.name,
        invitation_token: invitation.token // Include token in the email data
      }
    });

    if (error) {
      console.error('Error sending invitation:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Email invitation successfully sent via Supabase auth system");

    // Return success response
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in invitation function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error.message || String(error)) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
