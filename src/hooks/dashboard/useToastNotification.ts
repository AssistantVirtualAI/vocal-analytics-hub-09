
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

  return {
    showSuccessToast,
    showErrorToast
  };
}
