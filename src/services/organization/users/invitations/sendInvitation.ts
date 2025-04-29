
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

    // Get organization name for better email customization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error retrieving organization name:', orgError);
      // Don't throw here, we can continue with default name
    }

    const organizationName = organization?.name || "Votre organisation";
    const invitationUrl = `${window.location.origin}/auth?invitation=${invitationToken}`;

    // Attempt to send invitation email
    try {
      console.log('Sending invitation email with params:', {
        email, 
        organizationName, 
        invitationUrl
      });
      
      const { data, error: edgeFunctionError } = await supabase
        .functions.invoke('send-invitation-email', {
          body: {
            email,
            organizationName,
            invitationUrl
          }
        });

      if (edgeFunctionError) {
        console.error('Error invoking edge function:', edgeFunctionError);
        toast.error("Erreur lors de l'envoi de l'email d'invitation");
      } else {
        console.log('Email function response:', data);
        toast.success("Email d'invitation envoyé avec succès.");
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      toast.error("Erreur lors de l'envoi de l'email d'invitation");
    }

    toast.success("Invitation créée avec succès.");
  } catch (error: any) {
    console.error('Error in sendInvitation:', error);
    toast.error("Erreur lors de l'envoi de l'invitation: " + error.message);
    throw error;
  }
};
