
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

    // Create a new invitation - the token and expiry will be set by the trigger
    const { data: inviteData, error: createError } = await supabase
      .from('organization_invitations')
      .insert({
        email,
        organization_id: organizationId,
        status: 'pending'
      })
      .select('token')
      .single();
      
    if (createError) {
      console.error('Error creating new invitation:', createError);
      throw createError;
    }

    if (!inviteData?.token) {
      throw new Error("No token generated for invitation");
    }

    // Build the invitation URL with the token
    const invitationUrl = `${window.location.origin}/auth?invitation=${inviteData.token}&email=${encodeURIComponent(email)}`;
    
    // Send the email via our edge function
    const response = await fetch(`${window.location.origin}/functions/v1/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        organizationName: organizationData?.name || 'Notre organisation',
        invitationUrl
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send invitation email: ${errorData.error || response.statusText}`);
    }

    console.log('Invitation email sent successfully');
    toast(`L'invitation a été envoyée à ${email}`);
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    toast("Erreur lors du renvoi de l'invitation: " + error.message);
    throw error;
  }
};
