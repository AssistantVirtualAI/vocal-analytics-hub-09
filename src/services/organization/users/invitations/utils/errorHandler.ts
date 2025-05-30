
import { toast } from 'sonner';
import { handleApiError } from '@/utils/api-metrics';

/**
 * Displays appropriate toast messages based on error type
 * @param error Error object 
 * @param operation Operation description for the error message
 */
export const handleInvitationError = (error: any, operation: string = "opération"): void => {
  // Log the error for debugging
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

  // Handle already registered user case
  if (error?.message?.includes("already been registered") || error?.message?.includes("email_exists")) {
    toast.info("L'utilisateur est déjà inscrit. Ajout direct à l'organisation en cours...");
    return;
  }

  // Handle Edge Function errors
  if (error?.message?.includes("Edge Function returned a non-2xx")) {
    toast.error("La fonction d'invitation a rencontré une erreur. Vérifiez les informations fournies et réessayez.");
    return;
  }

  if (error?.message?.includes("Function returned a 4")) {
    toast.error("La fonction d'invitation a rencontré une erreur. Vérifiez les informations fournies.");
    return;
  }

  if (error?.message?.includes("Function returned a 5")) {
    toast.error("Le service d'invitation rencontre un problème. Veuillez réessayer plus tard.");
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

  // Handle other errors using the standard error handler
  handleApiError(error, (props) => {
    toast.error(props.description);
  }, `Erreur lors de ${operation}`);
};
