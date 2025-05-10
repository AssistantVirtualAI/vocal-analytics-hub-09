
import { showToast } from '@/hooks/use-toast';
import { handleApiError } from '@/utils/api-metrics';

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
      variant: "destructive"
    });
  };

  const showInvitationErrorToast = (error: any) => {
    handleApiError(error, (props) => {
      showToast(props.title, {
        description: props.description,
        variant: props.variant as "default" | "destructive" | undefined
      });
    }, "Erreur lors de l'envoi de l'invitation. Vérifiez les informations fournies.");
  };

  return {
    showSuccessToast,
    showErrorToast,
    showInvitationErrorToast
  };
}
