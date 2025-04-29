
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

    // Update status to refresh token and expiration via database trigger
    // First step: set status to something else temporarily
    const { error: tempUpdateError } = await supabase
      .from('organization_invitations')
      .update({ status: 'refreshing' })
      .eq('id', invitationId);

    if (tempUpdateError) {
      console.error('Error in temporary status update:', tempUpdateError);
      toast.error(`Erreur lors du rafraîchissement de l'invitation: ${tempUpdateError.message}`);
      throw tempUpdateError;
    }
    
    // Second step: set status back to pending to trigger token refresh
    const { data: updatedInvitation, error: updateError } = await supabase
      .from('organization_invitations')
      .update({ status: 'pending' })
      .eq('id', invitationId)
      .select('token')
      .maybeSingle();

    if (updateError) {
      console.error('Error refreshing invitation:', updateError);
      toast.error(`Erreur lors du rafraîchissement de l'invitation: ${updateError.message}`);
      throw updateError;
    }

    console.log('Updated invitation response:', updatedInvitation);

    // Define a variable to hold the token
    let invitationToken: string;

    if (!updatedInvitation || !updatedInvitation.token) {
      // If token is still missing, fetch it directly
      const { data: fetchedInvitation, error: fetchError } = await supabase
        .from('organization_invitations')
        .select('token')
        .eq('id', invitationId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching updated invitation:', fetchError);
        toast.error(`Erreur lors de la récupération de l'invitation: ${fetchError.message}`);
        throw fetchError;
      }

      if (!fetchedInvitation?.token) {
        const errorMsg = "Token d'invitation non généré";
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log(`Invitation fetched, token: ${fetchedInvitation.token}`);
      invitationToken = fetchedInvitation.token;
    } else {
      invitationToken = updatedInvitation.token;
    }

    // Get organization name for better email customization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .maybeSingle();

    if (orgError) {
      console.error('Error retrieving organization name:', orgError);
      // Don't throw here, we can continue with default name
    }

    const organizationName = organization?.name || "Votre organisation";
    const invitationUrl = `${window.location.origin}/auth?invitation=${invitationToken}`;

    console.log('Preparing to send invitation email with params:', {
      email, 
      organizationName, 
      invitationUrl
    });
    
    // Call the edge function to send the invitation email
    try {
      const { data, error: edgeFunctionError } = await supabase
        .functions.invoke('send-invitation-email', {
          body: {
            email,
            organizationName,
            invitationUrl
          }
        });

      // Handle function invoke errors
      if (edgeFunctionError) {
        console.error('Error invoking edge function:', edgeFunctionError);
        toast.error(`Erreur lors de l'envoi de l'email d'invitation: ${edgeFunctionError.message}`);
        throw edgeFunctionError;
      }
      
      // Handle error responses from the function
      if (data && !data.success) {
        console.error('Edge function returned an error:', data.error);
        
        let errorMessage = "Erreur inconnue";
        
        // Check what type of error we have and extract the message
        if (data.error) {
          if (typeof data.error === 'object' && data.error !== null) {
            // We have a structured error object
            if (data.error.message) {
              errorMessage = data.error.message;
            } else {
              errorMessage = JSON.stringify(data.error);
            }
          } else if (typeof data.error === 'string') {
            // We have a string error
            errorMessage = data.error;
          }
        }
        
        // Special handling for Resend validation error (testing mode)
        if (errorMessage.includes("verify a domain") || 
            errorMessage.includes("send testing emails to your own email") || 
            errorMessage.includes("change the `from` address")) {
          
          toast.error("La configuration d'email n'est pas terminée: Vous devez vérifier un domaine dans Resend.com et configurer une adresse d'expéditeur utilisant ce domaine. En mode test, vous ne pouvez envoyer des emails qu'à votre propre adresse.");
          
          // Create a more specific error to throw
          const resendError = new Error("Configuration Resend incomplète");
          throw resendError;
        } 
        // Handle rate limiting
        else if (errorMessage.toLowerCase().includes("rate limit")) {
          toast.error("Limite d'envoi d'emails atteinte. Veuillez réessayer plus tard.");
        } 
        // Generic error
        else {
          toast.error(`Erreur lors de l'envoi de l'email: ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
      }
      
      // Check if the response has the expected format
      if (!data || !data.success) {
        console.error('Unexpected edge function response format:', data);
        toast.error("Format de réponse inattendu du serveur.");
        throw new Error("Format de réponse inattendu");
      }
      
      console.log('Email function response:', data);
      toast.success("Email d'invitation envoyé avec succès.");
    } catch (emailError: any) {
      console.error('Error sending invitation email:', emailError);
      
      // If this is not our custom Resend error (which we already toasted),
      // show a generic error message
      if (emailError.message !== "Configuration Resend incomplète") {
        // More user-friendly error message
        let errorMessage;
        
        if (emailError.message && emailError.message.includes('Failed to fetch')) {
          errorMessage = "Impossible de contacter le serveur d'emails. Veuillez réessayer plus tard.";
        } else {
          errorMessage = "Erreur lors de l'envoi de l'email d'invitation: " + 
            (typeof emailError === 'object' && emailError !== null ? 
              (emailError.message || JSON.stringify(emailError)) : 
              String(emailError));
        }
        
        toast.error(errorMessage);
      }
      
      throw emailError;
    }
    
    toast.success("Invitation renvoyée avec succès.");
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    
    // Only show the toast if it's not already shown in a specific catch block
    if (!error.message?.includes('Token d\'invitation') && 
        !error.message?.includes('invitation en attente') &&
        !error.message?.includes('email d\'invitation') &&
        !error.message?.includes('du serveur') &&
        !error.message?.includes('Impossible de contacter') &&
        !error.message?.includes('Configuration Resend incomplète')) {
      
      // Handle object errors better
      let errorMsg;
      if (typeof error === 'object' && error !== null) {
        errorMsg = error.message || (typeof error.toString === 'function' ? error.toString() : 'Erreur inconnue');
      } else {
        errorMsg = String(error);
      }
      
      toast.error(`Erreur lors du renvoi de l'invitation: ${errorMsg}`);
    }
    
    throw error;
  }
};
