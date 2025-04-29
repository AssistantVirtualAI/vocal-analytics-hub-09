
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Accept an invitation
export const acceptInvitation = async (token: string, userId: string): Promise<void> => {
  try {
    console.log(`Accepting invitation with token ${token} for user ${userId}`);
    
    // Find the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('id, organization_id, email, expires_at')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (invitationError) {
      console.error('Error finding invitation:', invitationError);
      throw invitationError;
    }

    if (!invitation) {
      throw new Error("Invitation non trouvée ou déjà utilisée.");
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new Error("Cette invitation a expiré.");
    }

    // Add user to organization
    const { error: userOrgError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: invitation.organization_id
      });

    if (userOrgError) {
      console.error('Error adding user to organization:', userOrgError);
      throw userOrgError;
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error marking invitation as accepted:', updateError);
      throw updateError;
    }

    toast.success("Vous avez rejoint l'organisation avec succès.");
  } catch (error: any) {
    console.error('Error in acceptInvitation:', error);
    toast.error("Erreur lors de l'acceptation de l'invitation: " + error.message);
    throw error;
  }
};
