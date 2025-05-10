
import { showToast } from '@/hooks/use-toast';

/**
 * Hook to manage toast notifications for dashboard operations
 */
export function useToastNotification() {
  
  const showSuccessToast = () => {
    showToast("Succès", {
      description: "Les données ont été mises à jour.",
    });
  };

  const showErrorToast = () => {
    showToast("Erreur", {
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
    
    showToast("Erreur d'invitation", {
      description: message
    });
  };

  return {
    showSuccessToast,
    showErrorToast,
    showInvitationErrorToast
  };
}
