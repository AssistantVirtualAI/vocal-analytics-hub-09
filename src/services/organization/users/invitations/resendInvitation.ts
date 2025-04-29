
import { toast } from 'sonner';
import { findPendingInvitation, refreshInvitationToken } from './utils/invitationToken';
import { getOrganizationName } from './utils/organization';
import { sendInvitationEmail } from './utils/emailSender';
import { handleInvitationError } from './utils/errorHandler';

/**
 * Resends an invitation email for a pending invitation
 */
export const resendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Resending invitation to ${email} for organization ${organizationId}`);
    
    // Find the pending invitation
    const invitation = await findPendingInvitation(email, organizationId);
    const invitationId = invitation.id;
    console.log(`Found invitation ${invitationId}, updating...`);

    // Refresh the invitation token
    const invitationToken = await refreshInvitationToken(invitationId);
    
    // Get organization name
    const organizationName = await getOrganizationName(organizationId);
    
    // Generate invitation URL
    const invitationUrl = `${window.location.origin}/auth?invitation=${invitationToken}`;

    // Send the email
    try {
      await sendInvitationEmail({ email, organizationName, invitationUrl });
      toast.success("Email d'invitation envoyé avec succès.");
    } catch (emailError: any) {
      handleInvitationError(emailError, "de l'envoi de l'email d'invitation");
      throw emailError;
    }
    
    toast.success("Invitation renvoyée avec succès.");
  } catch (error: any) {
    handleInvitationError(error, "du renvoi de l'invitation");
    throw error;
  }
};
