
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
    
    // First, check if invitation exists and get the organization details for the email
    const { data: organizationData, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();
      
    if (orgError) {
      console.error('Error retrieving organization:', orgError);
      throw orgError;
    }

    // Check if the invitation exists
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

    // If no invitation found, create a new one
    if (!invitationData) {
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
    
    // Send the actual email via Supabase Auth API's invite user functionality
    // This will send a magic link to the user to set up their account
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: organizationId,
        organization_name: organizationData?.name || 'Notre organisation'
      },
      redirectTo: `${window.location.origin}/auth?org=${organizationId}`
    });
    
    if (authError) {
      console.error('Error sending invitation email:', authError);
      throw authError;
    }
    
    console.log('Invitation email sent successfully:', authData);
    toast(`Invitation renvoyée à ${email}`);
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    toast("Erreur lors du renvoi de l'invitation: " + error.message);
    throw error;
  }
};
