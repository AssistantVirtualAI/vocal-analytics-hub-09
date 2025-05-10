
import { toast } from '@/hooks/use-toast'; // Using the renamed toast function
import { handleApiError } from '@/utils/api-metrics';

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
      variant: "destructive"
    });
  };

  const showInvitationErrorToast = (error: any) => {
    handleApiError(error, (props) => {
      toast(props.title, {
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
