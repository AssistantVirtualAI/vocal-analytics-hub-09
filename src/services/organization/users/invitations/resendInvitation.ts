
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
      toast.error(`Erreur lors de la recherche de l'invitation: ${queryError.message}`);
      throw queryError;
    }

    if (!invitations || invitations.length === 0) {
      const errorMsg = 'Aucune invitation en attente trouvée';
      console.error(errorMsg);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Update the invitation (first one if multiple found)
    const invitationId = invitations[0].id;
    console.log(`Updating invitation ${invitationId}`);

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
      toast.error(`Erreur lors du rafraîchissement de l'invitation: ${updateError.message}`);
      throw updateError;
    }

    if (!updatedInvitation?.token) {
      const errorMsg = "Token d'invitation non généré";
      console.error(errorMsg);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`Invitation updated, new token: ${updatedInvitation.token}`);

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

    console.log('Preparing to send invitation email with params:', {
      email, 
      organizationName, 
      invitationUrl
    });
    
    // Attempt to send invitation email
    try {
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
        toast.error("Erreur lors de l'envoi de l'email d'invitation: " + edgeFunctionError.message);
        throw edgeFunctionError;
      } else {
        console.log('Email function response:', data);
        toast.success("Email d'invitation envoyé avec succès.");
      }
    } catch (emailError: any) {
      console.error('Error sending invitation email:', emailError);
      toast.error("Erreur lors de l'envoi de l'email d'invitation: " + (emailError.message || 'Erreur inconnue'));
      throw emailError;
    }
    
    toast.success("Invitation renvoyée avec succès.");
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    toast.error("Erreur lors du renvoi de l'invitation: " + error.message);
    throw error;
  }
};
