
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Resend an invitation
export const resendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Resending invitation to ${email} for organization ${organizationId}`);
    
    // First check if the invitation exists
    const { data: invitations, error: queryError } = await supabase
      .from('organization_invitations')
      .select('id, token')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    if (queryError) {
      console.error('Error querying invitation:', queryError);
      throw queryError;
    }

    if (!invitations || invitations.length === 0) {
      throw new Error('Aucune invitation en attente trouvée');
    }

    // Update the invitation (first one if multiple found)
    const invitationId = invitations[0].id;

    const { data: updatedInvitation, error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'pending'  // This will trigger the database function to update token and expiration
      })
      .eq('id', invitationId)
      .select('token')
      .single();

    if (updateError) {
      console.error('Error refreshing invitation:', updateError);
      throw updateError;
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
    const invitationUrl = `${window.location.origin}/auth?invitation=${updatedInvitation.token}`;

    // Attempt to send invitation email
    try {
      console.log('Resending invitation email with params:', {
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
    
    toast.success("Invitation renvoyée avec succès.");
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    toast.error("Erreur lors du renvoi de l'invitation: " + error.message);
    throw error;
  }
};
