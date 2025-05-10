
import { toast } from '@/hooks/use-toast';

/**
 * Hook to manage toast notifications for dashboard operations
 */
export function useToastNotification() {
  
  const showSuccessToast = () => {
    toast("Succès", {
      description: "Les données ont été mises à jour.",
    });
  };

  const showErrorToast = () => {
    toast("Erreur", {
      description: "Impossible de mettre à jour les données.",
    });
  };

  const showInvitationErrorToast = (error: any) => {
    let message = "Erreur lors de l'envoi de l'invitation. Vérifiez les informations fournies.";
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    toast("Erreur d'invitation", {
      description: message
    });
  };

  return {
    showSuccessToast,
    showErrorToast,
    showInvitationErrorToast
  };
}
