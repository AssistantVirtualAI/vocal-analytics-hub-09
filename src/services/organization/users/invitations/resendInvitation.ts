
import { toast } from 'sonner';
import { findPendingInvitation } from './utils/invitationToken';
import { handleInvitationError } from './utils/errorHandler';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resends an invitation email for a pending invitation using Supabase's native invitation system
 */
export const resendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Resending invitation to ${email} for organization ${organizationId}`);
    
    // Find the pending invitation
    const invitation = await findPendingInvitation(email, organizationId);
    const invitationId = invitation.id;
    console.log(`Found invitation ${invitationId}, updating...`);

    // Update invitation status to refresh token
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'pending' // This will trigger the database function to update token and expiration
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      throw updateError;
    }

    // Send invitation email using Supabase's native invitation system
    const { data: functionResult, error: functionError } = await supabase
      .functions.invoke('send-supabase-invitation', {
        body: { 
          email,
          organizationId 
        }
      });

    if (functionError) {
      console.error('Error resending invitation via edge function:', functionError);
      throw functionError;
    }

    if (functionResult && functionResult.error) {
      console.error('Error in supabase invitation:', functionResult.error);
      throw new Error(functionResult.error);
    }
    
    toast.success("Invitation renvoyée avec succès");
  } catch (error: any) {
    handleInvitationError(error, "du renvoi de l'invitation");
    throw error;
  }
};
