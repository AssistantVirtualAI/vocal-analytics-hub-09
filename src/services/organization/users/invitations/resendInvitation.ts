
import { toast } from 'sonner';
import { findPendingInvitation } from './utils/invitationToken';
import { handleInvitationError } from './utils/errorHandler';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resends an invitation email for a pending invitation using Supabase's native invitation system
 */
export const resendInvitation = async (email: string, organizationId: string): Promise<any> => {
  try {
    console.log(`Resending invitation to ${email} for organization ${organizationId}`);
    
    // Find the pending invitation
    const invitation = await findPendingInvitation(email, organizationId);
    
    if (!invitation) {
      console.error("No pending invitation found for this email");
      throw new Error("Aucune invitation en attente trouvée pour cette adresse email");
    }
    
    const invitationId = invitation.id;
    console.log(`Found invitation ${invitationId}, updating...`);

    // First step: Change status to something else temporarily
    const { error: tempUpdateError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'refreshing' // Temporary status to trigger a change
      })
      .eq('id', invitationId);

    if (tempUpdateError) {
      console.error('Error in temporary status update:', tempUpdateError);
      throw tempUpdateError;
    }

    // Second step: Change status back to pending to trigger the DB function
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

    console.log("Calling send-supabase-invitation edge function");
    
    // Send invitation email using Supabase's edge function
    const { data: functionResult, error: functionError } = await supabase
      .functions.invoke('send-supabase-invitation', {
        body: { 
          email,
          organizationId 
        }
      });

    console.log("Edge function response:", functionResult, functionError);

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

    return functionResult;
  } catch (error: any) {
    console.error('Complete error object:', error);
    
    if (!error.handledByErrorHandler) {
      handleInvitationError(error, "du renvoi de l'invitation");
      // Mark the error as handled by the error handler to prevent duplicate toasts
      error.handledByErrorHandler = true;
    }
    
    throw error;
  }
};
