
import { toast } from 'sonner';

/**
 * Displays appropriate toast messages based on error type
 */
export const handleInvitationError = (error: any, operation: string = "opération"): void => {
  console.error(`Error in invitation ${operation}:`, error);

  // Skip showing toast if it's already handled specifically
  if (error?.message?.includes('Configuration Resend incomplète')) {
    toast.error("La configuration d'email n'est pas terminée: Vous devez vérifier un domaine dans Resend.com et configurer une adresse d'expéditeur utilisant ce domaine.");
    return;
  }

  if (error?.message?.includes("Limite d'envoi d'emails atteinte")) {
    toast.error("Limite d'envoi d'emails atteinte. Veuillez réessayer plus tard.");
    return;
  }

  // Handle specific edge function errors
  if (error?.message?.includes("Failed to send a request to the Edge Function")) {
    toast.error("Erreur de connexion à la fonction d'invitation. Vérifiez que la fonction est déployée et accessible.");
    return;
  }

  if (error?.message?.includes("Token d'invitation") || 
      error?.message?.includes("invitation en attente") ||
      error?.message?.includes("email d'invitation") ||
      error?.message?.includes("du serveur") ||
      error?.message?.includes("Impossible de contacter")) {
    toast.error(error.message);
    return;
  }

  // Handle other errors
  let errorMsg;
  if (typeof error === 'object' && error !== null) {
    errorMsg = error.message || (typeof error.toString === 'function' ? error.toString() : 'Erreur inconnue');
  } else {
    errorMsg = String(error);
  }
  
  toast.error(`Erreur lors de ${operation}: ${errorMsg}`);
};
