
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
    
    // First, check if the user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
      
    if (existingUser) {
      console.log(`User ${email} already exists, handling as existing user`);
      
      // Check if user is already part of the organization
      const { data: existingOrgUser, error: orgUserError } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', organizationId)
        .single();
        
      if (!orgUserError && existingOrgUser) {
        toast.info("L'utilisateur est déjà membre de cette organisation.");
        return { status: "already_member" };
      }
      
      // Add user to organization directly
      const { error: addError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: existingUser.id,
          organization_id: organizationId
        });

      if (addError) {
        console.error('Error adding existing user to organization:', addError);
        throw addError;
      }
      
      // Remove pending invitation if it exists
      const invitation = await findPendingInvitation(email, organizationId);
      if (invitation) {
        const { error: deleteError } = await supabase
          .from('organization_invitations')
          .delete()
          .eq('id', invitation.id);
          
        if (deleteError) {
          console.error('Error deleting invitation:', deleteError);
        }
      }
      
      toast.success("L'utilisateur a été ajouté à l'organisation.");
      return { status: "user_added" };
    }
    
    // Continue with finding and updating the pending invitation for non-existing users
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
      // Check if the error is because the user already exists
      if (functionError.message && functionError.message.includes('already been registered')) {
        console.log("User already exists, handling as existing user");
        return resendInvitation(email, organizationId); // Retry with the user exists path
      }
      
      console.error('Error resending invitation via edge function:', functionError);
      throw functionError;
    }

    // Handle error responses from the function
    if (functionResult && functionResult.error) {
      // Check if the error is because the user already exists
      if (typeof functionResult.error === 'string' && 
          functionResult.error.includes('already been registered')) {
        console.log("User already exists, handling as existing user");
        return resendInvitation(email, organizationId); // Retry with the user exists path
      }
      
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
    
    // Checking if the error is due to the user already existing
    if (error.message && typeof error.message === 'string') {
      if (error.message.includes('already been registered') || 
          error.message.includes('email_exists')) {
        console.log("User already exists error detected");
        // This should be handled above, but just in case
        toast.info("L'utilisateur existe déjà. Essayez de l'ajouter directement.");
        return { status: "user_exists" };
      }
    }
    
    if (!error.handledByErrorHandler) {
      handleInvitationError(error, "du renvoi de l'invitation");
      // Mark the error as handled by the error handler to prevent duplicate toasts
      error.handledByErrorHandler = true;
    }
    
    throw error;
  }
};
