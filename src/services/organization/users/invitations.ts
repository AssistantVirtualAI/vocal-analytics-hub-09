
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
    
    // First, check if invitation exists
    const { data: invitationData, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single();
      
    if (invitationError && invitationError.code !== 'PGRST116') {
      console.error('Error checking invitation:', invitationError);
      throw invitationError;
    }
    
    if (!invitationData) {
      // No invitation found, create a new one
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
    }
    
    // For now, this is a placeholder that will be replaced with actual email sending logic
    // We're just showing a toast message to confirm the action was triggered
    toast(`Invitation renvoyée à ${email}`);
    
    // In a real implementation, you would call an API endpoint or edge function to send the email
    // For example:
    // await supabase.functions.invoke('resend-invitation', { body: { email, organizationId } });
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    toast("Erreur lors du renvoi de l'invitation: " + error.message);
    throw error;
  }
};
