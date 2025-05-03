
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage toast notifications for dashboard operations
 */
export function useToastNotification() {
  const { toast } = useToast();
  
  const showSuccessToast = () => {
    toast({
      title: "Succès",
      description: "Les données ont été mises à jour.",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Erreur",
      description: "Impossible de mettre à jour les données.",
      variant: "destructive",
    });
  };

  const showInvitationErrorToast = (error: any) => {
    let message = "Erreur lors de l'envoi de l'invitation. Vérifiez les informations fournies.";
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    toast({
      title: "Erreur d'invitation",
      description: message,
      variant: "destructive",
    });
  };

  return {
    showSuccessToast,
    showErrorToast,
    showInvitationErrorToast
  };
}
