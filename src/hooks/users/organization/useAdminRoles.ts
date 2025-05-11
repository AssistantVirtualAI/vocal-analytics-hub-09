
import { useState, useCallback } from 'react';
import { 
  setOrganizationAdminStatus,
  setSuperAdminStatus,
  checkOrganizationAdminStatus,
  checkSuperAdminStatus
} from '@/services/organization/users/adminRoles';

export const useAdminRoles = (
  selectedOrg: string | null,
  currentUserId: string | undefined,
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);
  const [currentUserIsOrgAdmin, setCurrentUserIsOrgAdmin] = useState(false);
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);

  const toggleOrganizationAdmin = useCallback(async (userId: string, makeAdmin: boolean) => {
    if (!selectedOrg) return;
    
    setLoading(true);
    try {
      await setOrganizationAdminStatus(userId, selectedOrg, makeAdmin);
      if (refreshUsers) await refreshUsers();
    } catch (error) {
      console.error('Error toggling organization admin:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, refreshUsers]);

  const toggleSuperAdmin = useCallback(async (userId: string, makeAdmin: boolean) => {
    setLoading(true);
    try {
      await setSuperAdminStatus(userId, makeAdmin);
      if (refreshUsers) await refreshUsers();
    } catch (error) {
      console.error('Error toggling super admin:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshUsers]);

  const checkCurrentUserPermissions = useCallback(async () => {
    if (!currentUserId) {
      setCurrentUserIsOrgAdmin(false);
      setCurrentUserIsSuperAdmin(false);
      return { isOrgAdmin: false, isSuperAdmin: false };
    }

    // Check if current user is a super admin
    const isSuperAdmin = await checkSuperAdminStatus(currentUserId);
    setCurrentUserIsSuperAdmin(isSuperAdmin);

    // Check if current user is an organization admin (if org is selected)
    let isOrgAdmin = false;
    if (selectedOrg) {
      isOrgAdmin = await checkOrganizationAdminStatus(currentUserId, selectedOrg);
      setCurrentUserIsOrgAdmin(isOrgAdmin || isSuperAdmin); // Super admins are also considered org admins
    }

    return { isOrgAdmin: isOrgAdmin || isSuperAdmin, isSuperAdmin };
  }, [currentUserId, selectedOrg]);

  return {
    loading,
    toggleOrganizationAdmin,
    toggleSuperAdmin,
    checkCurrentUserPermissions,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin
  };
};
