
/**
 * Generates the HTML email template for invitations
 */
export function generateInvitationEmailTemplate(organizationName: string, invitationUrl: string): string {
  return `<!DOCTYPE html>
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
      Vous avez été invité à créer un compte utilisateur sur <strong>${organizationName}</strong>.<br>
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
      <p>Cet e-mail est généré par AVA Groupe 2025.<br>
      Tous droits réservés à Assistant Virtual AI Automation INC.</p>
      <p>Contactez-nous : <a href="mailto:aiagent@assistantvirtualai.com">aiagent@assistantvirtualai.com</a></p>
    </div>
  </div>
</body>
</html>`;
}
