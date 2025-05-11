
import { useState, useEffect, useCallback } from 'react';
import { checkSuperAdminStatus, checkOrganizationAdminStatus } from '@/services/organization/users/adminRoles';

export const useAdminRoles = (
  selectedOrg: string | null, 
  userId: string | undefined, 
  refreshCallback?: () => Promise<void>
) => {
  const [currentUserIsOrgAdmin, setCurrentUserIsOrgAdmin] = useState(false);
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if the current user is a super admin or an organization admin
  const checkCurrentUserPermissions = useCallback(async () => {
    if (!userId) return { isSuperAdmin: false, isOrgAdmin: false };
    
    try {
      setLoading(true);
      // First check if user is a super admin (this applies to all orgs)
      const isSuperAdmin = await checkSuperAdminStatus(userId);
      console.log(`User ${userId} super admin status:`, isSuperAdmin);
      
      // Then check if user is an admin of the current org
      let isOrgAdmin = isSuperAdmin; // Super admins are implicitly org admins
      
      if (!isOrgAdmin && selectedOrg) {
        // Only check org admin status if not already a super admin and an org is selected
        isOrgAdmin = await checkOrganizationAdminStatus(userId, selectedOrg);
        console.log(`User ${userId} org admin status for org ${selectedOrg}:`, isOrgAdmin);
      }
      
      console.log(`User ${userId} permissions - Super Admin: ${isSuperAdmin}, Org Admin: ${isOrgAdmin}`);
      
      // Update state
      setCurrentUserIsSuperAdmin(isSuperAdmin);
      setCurrentUserIsOrgAdmin(isOrgAdmin);
      
      return { isSuperAdmin, isOrgAdmin };
    } catch (error) {
      console.error("Error checking admin permissions:", error);
      return { isSuperAdmin: false, isOrgAdmin: false };
    } finally {
      setLoading(false);
    }
  }, [userId, selectedOrg]);

  // Check permissions when component mounts or dependencies change
  useEffect(() => {
    if (userId) {
      checkCurrentUserPermissions();
    }
  }, [userId, selectedOrg, checkCurrentUserPermissions]);

  return {
    loading,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin,
    checkCurrentUserPermissions
  };
};
