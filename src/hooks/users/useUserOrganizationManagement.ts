
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { addUserToOrganization } from '@/services/organization/users/addUser';
import { removeUserFromOrganization } from '@/services/organization/users/removeUser';
import { resetUserPassword } from '@/services/organization/users/passwordReset';
import { cancelInvitation, resendInvitation } from '@/services/organization/users/invitations';

export const useUserOrganizationManagement = (
  selectedOrg: string | null, 
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);

  const addUserToOrg = useCallback(async (email: string) => {
    if (!selectedOrg) {
      toast("Aucune organisation sélectionnée");
      return;
    }
    
    setLoading(true);
    try {
      await addUserToOrganization(email, selectedOrg);
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error("Error adding user to organization:", error);
      // Toast is handled in the service
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, refreshUsers]);

  const removeUserFromOrg = useCallback(async (userId: string) => {
    if (!selectedOrg) {
      toast("Aucune organisation sélectionnée");
      return;
    }
    
    setLoading(true);
    try {
      await removeUserFromOrganization(userId, selectedOrg);
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error("Error removing user from organization:", error);
      // Toast is handled in the service
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, refreshUsers]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      await resetUserPassword(email);
    } catch (error) {
      console.error("Error resetting password:", error);
      // Toast is handled in the service
    } finally {
      setLoading(false);
    }
  }, []);

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
    addUserToOrg,
    removeUserFromOrg,
    resetPassword,
    cancelInvitation: cancelUserInvitation,
    resendInvitation: resendUserInvitation
  };
};
