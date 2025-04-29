
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getOrganizationName } from './utils/organization';
import { sendInvitationEmail } from './utils/emailSender';
import { handleInvitationError } from './utils/errorHandler';

// Send an invitation to join an organization
export const sendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Sending invitation to ${email} for organization ${organizationId}`);

    // Check if invitation already exists
    const { data: existingInvitation, error: checkError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing invitation:', checkError);
      throw checkError;
    }

    let invitationToken;
    
    if (existingInvitation) {
      console.log('Invitation already exists, refreshing it');
      
      // Refresh existing invitation
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('organization_invitations')
        .update({
          status: 'pending'  // This will trigger the database function to update token and expiration
        })
        .eq('id', existingInvitation.id)
        .select('token')
        .single();

      if (updateError) {
        console.error('Error refreshing invitation:', updateError);
        throw updateError;
      }
      
      invitationToken = updatedInvitation.token;
    } else {
      // Create new invitation
      const { data: newInvitation, error: insertError } = await supabase
        .from('organization_invitations')
        .insert({
          email,
          organization_id: organizationId,
          status: 'pending'
        })
        .select('token')
        .single();

      if (insertError) {
        console.error('Error creating invitation:', insertError);
        throw insertError;
      }
      
      invitationToken = newInvitation.token;
    }

    // Get organization name
    const organizationName = await getOrganizationName(organizationId);
    
    // Generate invitation URL
    const invitationUrl = `${window.location.origin}/auth?invitation=${invitationToken}`;

    // Send invitation email
    try {
      await sendInvitationEmail({ email, organizationName, invitationUrl });
      toast.success("Email d'invitation envoyé avec succès.");
    } catch (emailError: any) {
      handleInvitationError(emailError, "de l'envoi de l'email d'invitation");
      // We don't throw here because we still want to acknowledge that the invitation was created
      // even if the email failed to send
    }

    toast.success("Invitation créée avec succès.");
  } catch (error: any) {
    handleInvitationError(error, "de l'envoi de l'invitation");
    throw error;
  }
};
