
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { OrganizationUser } from '@/types/organization';
import { 
  setOrganizationAdminStatus, 
  setSuperAdminStatus 
} from '@/services/organization/users/adminRoles';
import { 
  removeUserFromOrganization, 
  cancelInvitation, 
  resendInvitation, 
  resetUserPassword 
} from '@/services/organization/userManagement';

interface UseOrganizationUsersActionsProps {
  fetchUsers: () => Promise<void> | void;
  organizationId: string;
}

export const useOrganizationUsersActions = ({ 
  fetchUsers, 
  organizationId 
}: UseOrganizationUsersActionsProps) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const refreshInProgressRef = useRef(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || refreshInProgressRef.current || !organizationId) return;
    
    refreshInProgressRef.current = true;
    setIsRefreshing(true);
    
    try {
      setError(null);
      console.log("OrganizationUsersActions - Refreshing users for org:", organizationId);
      await fetchUsers();
      
      if (isMountedRef.current) {
        toast.success("Liste des utilisateurs actualisée");
      }
    } catch (error: any) {
      console.error("Error refreshing users:", error);
      if (isMountedRef.current) {
        setError(error);
        toast.error("Erreur lors de l'actualisation: " + error.message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
      refreshInProgressRef.current = false;
    }
  }, [fetchUsers, isRefreshing, organizationId]);

  const handleRemoveUserFromOrg = async (userId: string) => {
    if (!organizationId || actionLoading) {
      toast.error("ID d'organisation non spécifié");
      return;
    }
    
    setActionLoading(true);
    try {
      console.log(`Attempting to remove user ${userId} from org ${organizationId}`);
      await removeUserFromOrganization(userId, organizationId);
      if (isMountedRef.current) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error removing user from org:", error);
    } finally {
      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      console.log(`Attempting to cancel invitation ${invitationId}`);
      await cancelInvitation(invitationId);
      if (isMountedRef.current) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
    } finally {
      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  const handleResendInvitation = async (email: string) => {
    if (!organizationId || actionLoading) {
      toast.error("ID d'organisation non spécifié");
      return;
    }
    
    setResendingFor(email);
    setActionLoading(true);
    try {
      console.log(`Attempting to resend invitation to ${email} for org ${organizationId}`);
      await resendInvitation(email, organizationId);
      if (isMountedRef.current) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
    } finally {
      if (isMountedRef.current) {
        setResendingFor(null);
        setActionLoading(false);
      }
    }
  };

  const handleResetPassword = async (email: string) => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      console.log(`Attempting to reset password for ${email}`);
      await resetUserPassword(email);
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  const handleToggleOrgAdmin = async (userId: string, makeAdmin: boolean) => {
    if (!organizationId || actionLoading) {
      toast.error("ID d'organisation non spécifié");
      return;
    }
    
    setActionLoading(true);
    try {
      await setOrganizationAdminStatus(userId, organizationId, makeAdmin);
      if (isMountedRef.current) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error toggling org admin status:", error);
    } finally {
      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  const handleToggleSuperAdmin = async (userId: string, makeAdmin: boolean) => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      await setSuperAdminStatus(userId, makeAdmin);
      if (isMountedRef.current) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Error toggling super admin status:", error);
    } finally {
      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  };

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
    handleToggleSuperAdmin
  };
};
