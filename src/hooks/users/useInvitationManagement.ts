
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { cancelInvitation, resendInvitation } from '@/services/organization/users/invitations';

export const useInvitationManagement = (
  selectedOrg: string | null,
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);

  const cancelUserInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    try {
      await cancelInvitation(invitationId);
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      // Toast is handled in the service
    } finally {
      setLoading(false);
    }
  }, [refreshUsers]);

  const resendUserInvitation = useCallback(async (email: string) => {
    if (!selectedOrg) {
      toast("Aucune organisation sélectionnée");
      return;
    }
    
    setLoading(true);
    try {
      await resendInvitation(email, selectedOrg);
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      // Toast is handled in the service
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, refreshUsers]);

  return {
    loading,
    cancelInvitation: cancelUserInvitation,
    resendInvitation: resendUserInvitation
  };
};
