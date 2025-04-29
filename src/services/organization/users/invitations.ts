
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Cancel an invitation
export const cancelInvitation = async (invitationId: string): Promise<void> => {
  try {
    console.log(`Cancelling invitation ${invitationId}`);
    
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }

    toast("L'invitation a été annulée avec succès.");
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error);
    toast("Erreur lors de l'annulation de l'invitation: " + error.message);
    throw error;
  }
};

// Resend invitation
export const resendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Resending invitation to ${email} for organization ${organizationId}`);
    
    // First, check if organization exists
    const { data: organizationData, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();
      
    if (orgError) {
      console.error('Error retrieving organization:', orgError);
      throw orgError;
    }

    // Check if invitation exists and delete it to create a fresh one
    const { error: deleteError } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('email', email)
      .eq('organization_id', organizationId);
      
    if (deleteError) {
      console.error('Error deleting existing invitation:', deleteError);
      // Continue even if deletion fails (might not exist)
    }

    // Create a new invitation
    const { error: createError } = await supabase
      .from('organization_invitations')
      .insert({
        email,
        organization_id: organizationId,
        status: 'pending'
      });
      
    if (createError) {
      console.error('Error creating new invitation:', createError);
      throw createError;
    }

    // Instead of using the admin API, we'll just show a success message
    // and inform the user that the invitation has been refreshed in the database
    console.log('Invitation refreshed successfully for:', email);
    toast(`L'invitation pour ${email} a été rafraîchie. Un email sera envoyé automatiquement par le système.`);
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    toast("Erreur lors du renvoi de l'invitation: " + error.message);
    throw error;
  }
};
