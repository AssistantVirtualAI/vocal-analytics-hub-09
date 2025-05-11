
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { cancelInvitation, resendInvitation } from '@/services/organization/users/invitations';

export const useInvitationManagement = (
  organizationId: string | null,
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  
  const cancelInvitationHandler = useCallback(async (invitationId: string) => {
    if (!organizationId || loading) return;
    
    setLoading(true);
    try {
      await cancelInvitation(invitationId);
      if (refreshUsers) {
        await refreshUsers();
      }
      toast.success("Invitation annulée avec succès");
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast.error("Erreur lors de l'annulation de l'invitation: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, loading, refreshUsers]);
  
  const resendInvitationHandler = useCallback(async (email: string) => {
    // Don't proceed if already sending an invitation or if this email is already being processed
    if (!organizationId || loading || resendingFor === email) {
      return;
    }
    
    setResendingFor(email);
    const toastId = toast.loading("Envoi de l'invitation en cours...");
    
    try {
      await resendInvitation(email, organizationId);
      
      toast.dismiss(toastId);
      toast.success("Invitation envoyée avec succès");
      
      // Always refresh the user list after successful operation
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.dismiss(toastId);
      toast.error("Erreur lors de l'envoi: " + (error.message || "Une erreur est survenue"));
    } finally {
      setResendingFor(null);
    }
  }, [organizationId, loading, resendingFor, refreshUsers]);

  return {
    loading,
    resendingFor,
    cancelInvitation: cancelInvitationHandler,
    resendInvitation: resendInvitationHandler
  };
};
