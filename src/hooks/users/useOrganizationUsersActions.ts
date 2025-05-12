
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useUserOrganizationManagement } from './useUserOrganizationManagement';

interface UseOrganizationUsersActionsProps {
  fetchUsers: () => Promise<void>; // Updated type signature to always expect Promise<void>
  organizationId: string;
}

export const useOrganizationUsersActions = ({ 
  fetchUsers,
  organizationId
}: UseOrganizationUsersActionsProps) => {
  // State management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // User organization management hook
  const {
    loading: actionLoading,
    resendingFor,
    removeUserFromOrg,
    cancelInvitation,
    resendInvitation,
    resetPassword,
    toggleOrganizationAdmin,
    toggleSuperAdmin,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin,
  } = useUserOrganizationManagement(organizationId, fetchUsers);

  // Handle refreshing the users list
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err);
      toast.error("Error refreshing users: " + (err.message || "Unknown error"));
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUsers]);

  // Handle removing a user from organization
  const handleRemoveUserFromOrg = useCallback(async (userId: string) => {
    try {
      await removeUserFromOrg(userId);
      toast.success("User removed successfully");
    } catch (error) {
      console.error("Error removing user:", error);
    }
  }, [removeUserFromOrg]);

  // Handle canceling an invitation
  const handleCancelInvitation = useCallback(async (invitationId: string) => {
    try {
      await cancelInvitation(invitationId);
      toast.success("Invitation canceled");
    } catch (error) {
      console.error("Error canceling invitation:", error);
    }
  }, [cancelInvitation]);

  // Handle resending an invitation
  const handleResendInvitation = useCallback(async (email: string) => {
    try {
      await resendInvitation(email);
      toast.success("Invitation resent to " + email);
    } catch (error) {
      console.error("Error resending invitation:", error);
    }
  }, [resendInvitation]);

  // Handle resetting a user's password
  const handleResetPassword = useCallback(async (email: string) => {
    try {
      await resetPassword(email);
      toast.success("Password reset link sent to " + email);
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  }, [resetPassword]);

  // Handle toggling a user's org admin status
  const handleToggleOrgAdmin = useCallback(async (userId: string, makeAdmin: boolean) => {
    try {
      await toggleOrganizationAdmin(userId, makeAdmin);
      toast.success(`User ${makeAdmin ? 'promoted to' : 'demoted from'} organization admin`);
    } catch (error) {
      console.error("Error toggling org admin:", error);
    }
  }, [toggleOrganizationAdmin]);

  // Handle toggling a user's super admin status
  const handleToggleSuperAdmin = useCallback(async (userId: string, makeAdmin: boolean) => {
    try {
      await toggleSuperAdmin(userId, makeAdmin);
      toast.success(`User ${makeAdmin ? 'promoted to' : 'demoted from'} super admin`);
    } catch (error) {
      console.error("Error toggling super admin:", error);
    }
  }, [toggleSuperAdmin]);

  return {
    actionLoading,
    resendingFor,
    isRefreshing,
    error,
    handleRefresh,
    handleRemoveUserFromOrg,
    handleCancelInvitation,
    handleResendInvitation,
    handleResetPassword,
    handleToggleOrgAdmin,
    handleToggleSuperAdmin,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin
  };
};
