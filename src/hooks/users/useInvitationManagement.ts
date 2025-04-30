
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { cancelInvitation, resendInvitation } from '@/services/organization/users/invitations';

export const useInvitationManagement = (
  selectedOrg: string | null,
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const cancelUserInvitation = useCallback(async (invitationId: string) => {
    setCancelLoading(true);
    try {
      await cancelInvitation(invitationId);
      if (refreshUsers) {
        await refreshUsers();
        toast.success("Invitation annulée avec succès");
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      // Toast is handled in the service
    } finally {
      setCancelLoading(false);
    }
  }, [refreshUsers]);

  const resendUserInvitation = useCallback(async (email: string) => {
    if (!selectedOrg) {
      toast.error("Aucune organisation sélectionnée");
      return;
    }
    
    console.log(`useInvitationManagement: Resending invitation to ${email} for org ${selectedOrg}`);
    setResendLoading(true);
    try {
      await resendInvitation(email, selectedOrg);
      console.log("Invitation resent successfully, refreshing users...");
      if (refreshUsers) {
        await refreshUsers();
      }
      toast.success("Invitation renvoyée avec succès");
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast.error(`Erreur: ${error.message || "Impossible de renvoyer l'invitation"}`);
    } finally {
      setResendLoading(false);
    }
  }, [selectedOrg, refreshUsers]);

  return {
    loading: loading || cancelLoading || resendLoading,
    cancelLoading,
    resendLoading,
    cancelInvitation: cancelUserInvitation,
    resendInvitation: resendUserInvitation
  };
};
