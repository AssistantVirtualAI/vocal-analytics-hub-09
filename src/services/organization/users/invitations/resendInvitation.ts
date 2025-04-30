
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

    console.log("Calling send-invitation-email edge function");
    
    // Send invitation email using Supabase's edge function with timeout handling
    try {
      const { data: functionResult, error: functionError } = await supabase
        .functions.invoke('send-invitation-email', {
          body: { 
            email,
            organizationId 
          },
          headers: {
            "Content-Type": "application/json"
          },
          // Set a timeout for the request to avoid hanging indefinitely
          abortSignal: AbortSignal.timeout(15000) // 15 second timeout
        });

      if (functionError) {
        console.error('Error resending invitation via edge function:', functionError);
        throw functionError;
      }

      // Handle error responses from the function
      if (functionResult && functionResult.error) {
        console.error('Error in invitation function:', functionResult.error);
        throw new Error(
          typeof functionResult.error === 'string' 
            ? functionResult.error 
            : JSON.stringify(functionResult.error)
        );
      }

      console.log('Invitation resend successful:', functionResult);
    } catch (fetchError: any) {
      console.error('Error invoking edge function:', fetchError);
      if (fetchError.name === 'AbortError') {
        throw new Error('La requête a expiré. Vérifiez que les fonctions Edge sont déployées et accessibles.');
      }
      if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
        throw new Error('Impossible de contacter le service d\'invitations. Vérifiez que les fonctions Edge sont actives et accessibles.');
      }
      throw fetchError;
    }
    
    toast.success("Invitation renvoyée avec succès");
  } catch (error: any) {
    console.error('Complete error object:', error);
    handleInvitationError(error, "du renvoi de l'invitation");
    throw error;
  }
};
