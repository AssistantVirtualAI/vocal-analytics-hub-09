
import { useState, useEffect, useCallback, useRef } from 'react';
import { checkUserIsOrgAdmin, checkUserIsSuperAdmin } from './adminChecks';
import { toggleOrganizationAdminStatus, toggleSuperAdminStatus } from './adminActions';

export const useAdminRoles = (
  organizationId: string | null,
  userId: string | undefined,
  refreshUsers?: () => Promise<void>
) => {
  const [currentUserIsOrgAdmin, setCurrentUserIsOrgAdmin] = useState(false);
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const checkInProgressRef = useRef(false);
  const isMountedRef = useRef(true);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      checkInProgressRef.current = false;
    };
  }, []);

  // Check user permissions
  const checkUserAccess = useCallback(async () => {
    if (!userId || !organizationId || checkInProgressRef.current) {
      return;
    }

    checkInProgressRef.current = true;
    setLoading(true);

    try {
      console.log(`[useAdminRoles] Checking permissions for user ${userId} in org ${organizationId}`);
      
      // Check if user is super admin
      const isSuperAdmin = await checkUserIsSuperAdmin(userId);
      
      // If user is super admin, they're automatically an org admin too
      if (isSuperAdmin && isMountedRef.current) {
        console.log(`[useAdminRoles] User ${userId} super admin status: ${isSuperAdmin}`);
        setCurrentUserIsSuperAdmin(true);
        setCurrentUserIsOrgAdmin(true);
        checkInProgressRef.current = false;
        return;
      }
      
      // Check if user is org admin
      const isOrgAdmin = await checkUserIsOrgAdmin(userId, organizationId);
      
      if (isMountedRef.current) {
        console.log(`[useAdminRoles] User ${userId} permissions - Super Admin: ${isSuperAdmin}, Org Admin: ${isOrgAdmin}`);
        setCurrentUserIsOrgAdmin(isOrgAdmin);
        setCurrentUserIsSuperAdmin(isSuperAdmin);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      if (isMountedRef.current) {
        setCurrentUserIsOrgAdmin(false);
        setCurrentUserIsSuperAdmin(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      checkInProgressRef.current = false;
    }
  }, [userId, organizationId]);

  // Check permissions whenever dependencies change
  useEffect(() => {
    if (userId && organizationId) {
      console.log('[useAdminRoles] Dependencies changed, checking permissions');
      checkUserAccess();
    }
  }, [userId, organizationId, checkUserAccess]);

  // Toggle organization admin status
  const toggleOrganizationAdmin = useCallback(async (targetUserId: string, makeAdmin: boolean) => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      await toggleOrganizationAdminStatus(targetUserId, organizationId, makeAdmin);
      
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error('Error toggling organization admin status:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, refreshUsers]);

  // Toggle super admin status
  const toggleSuperAdmin = useCallback(async (targetUserId: string, makeAdmin: boolean) => {
    setLoading(true);
    try {
      await toggleSuperAdminStatus(targetUserId, makeAdmin);
      
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error('Error toggling super admin status:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshUsers]);

  return {
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin,
    loading,
    checkCurrentUserPermissions: checkUserAccess,
    toggleOrganizationAdmin,
    toggleSuperAdmin
  };
};
