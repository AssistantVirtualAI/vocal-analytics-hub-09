
export const generateInvitationEmailTemplate = (organizationName: string, invitationUrl: string): string => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Invitation à rejoindre ${organizationName} - AVA AI Dashboard</title>
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
      <!-- Logo inline en base64 pour éviter les blocages d'images externes -->
      <img src="data:image/webp;base64,UklGRo4IAABXRUJQVlA4WAoAAABQBwCdASoU...8pNVYL8TbvgJ35SnH+/z78A2uHxEfKWv8pEAAAAAA=" alt="AVA AI Logo" />
    </div>

    <h2>Vous êtes invité(e) à rejoindre ${organizationName} !</h2>
    <p class="intro">
      Vous avez été invité(e) à rejoindre l'organisation <strong>${organizationName}</strong> sur la plateforme AVA AI.
      Pour accepter cette invitation, veuillez cliquer sur le bouton ci-dessous.
    </p>

    <a href="${invitationUrl}" class="button">Accepter l'invitation</a>

    <p class="intro">
      Cette invitation expirera dans 7 jours. Si vous n'avez pas demandé cette invitation, 
      vous pouvez simplement ignorer cet email.
    </p>

    <div class="footer">
      <p>&copy; 2025 AVA AI. Tous droits réservés.</p>
      <p>This email is generated from AVA Groupe 2025. Tous droits sont réservés à Assistant Virtual AI Automation INC.</p>
      <p>Contactez-nous : <a href="mailto:aiagent@assistantvirtualai.com">aiagent@assistantvirtualai.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
};
