
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendEmailParams {
  email: string;
  organizationName: string;
  invitationUrl: string;
}

/**
 * Sends an invitation email using the send-invitation-email edge function
 */
export const sendInvitationEmail = async (params: SendEmailParams): Promise<void> => {
  const { email, organizationName, invitationUrl } = params;
  
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
    throw new Error(`Erreur lors de l'envoi de l'email d'invitation: ${edgeFunctionError.message}`);
  }

  // Handle error responses from the function
  if (data && !data.success) {
    console.error('Edge function returned an error:', data.error);
    
    let errorMessage = "Erreur inconnue";
    
    // Extract error message from the response
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
      
      throw new Error("Configuration Resend incomplète");
    } 
    // Handle rate limiting
    else if (errorMessage.toLowerCase().includes("rate limit")) {
      throw new Error("Limite d'envoi d'emails atteinte");
    } 
    // Generic error
    else {
      throw new Error(errorMessage);
    }
  }
  
  // Check if the response has the expected format
  if (!data || !data.success) {
    console.error('Unexpected edge function response format:', data);
    throw new Error("Format de réponse inattendu du serveur");
  }
  
  console.log('Email function response:', data);
};
