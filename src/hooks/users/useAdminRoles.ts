
import { useState, useEffect, useCallback } from 'react';
import { checkSuperAdminStatus, checkOrganizationAdminStatus } from '@/services/organization/users/adminRoles';
import { toast } from 'sonner';

export const useAdminRoles = (
  selectedOrg: string | null, 
  userId: string | undefined, 
  refreshCallback?: () => Promise<void>
) => {
  const [currentUserIsOrgAdmin, setCurrentUserIsOrgAdmin] = useState(false);
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);  // Set initial loading to true
  const [error, setError] = useState<Error | null>(null);

  // Check if the current user is a super admin or an organization admin
  const checkCurrentUserPermissions = useCallback(async () => {
    if (!userId) {
      console.log("[useAdminRoles] No user ID, defaulting to not admin");
      setCurrentUserIsOrgAdmin(false);
      setCurrentUserIsSuperAdmin(false);
      setLoading(false);
      return { isSuperAdmin: false, isOrgAdmin: false };
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log(`[useAdminRoles] Checking permissions for user ${userId} in org ${selectedOrg || 'none'}`);
      
      // First check if user is a super admin (this applies to all orgs)
      const isSuperAdmin = await checkSuperAdminStatus(userId);
      console.log(`[useAdminRoles] User ${userId} super admin status:`, isSuperAdmin);
      
      // Then check if user is an admin of the current org
      let isOrgAdmin = isSuperAdmin; // Super admins are implicitly org admins
      
      if (!isOrgAdmin && selectedOrg) {
        // Only check org admin status if not already a super admin and an org is selected
        isOrgAdmin = await checkOrganizationAdminStatus(userId, selectedOrg);
        console.log(`[useAdminRoles] User ${userId} org admin status for org ${selectedOrg}:`, isOrgAdmin);
      }
      
      console.log(`[useAdminRoles] User ${userId} permissions - Super Admin: ${isSuperAdmin}, Org Admin: ${isOrgAdmin}`);
      
      // Update state
      setCurrentUserIsSuperAdmin(isSuperAdmin);
      setCurrentUserIsOrgAdmin(isOrgAdmin);
      
      return { isSuperAdmin, isOrgAdmin };
    } catch (error: any) {
      console.error("[useAdminRoles] Error checking admin permissions:", error);
      setError(error);
      toast.error("Erreur lors de la vérification des permissions: " + error.message);
      setCurrentUserIsSuperAdmin(false);
      setCurrentUserIsOrgAdmin(false);
      return { isSuperAdmin: false, isOrgAdmin: false };
    } finally {
      setLoading(false);
    }
  }, [userId, selectedOrg]);

  // Check permissions when component mounts or dependencies change
  useEffect(() => {
    if (userId) {
      console.log("[useAdminRoles] Dependencies changed, checking permissions");
      checkCurrentUserPermissions();
    } else {
      console.log("[useAdminRoles] Missing userId, skipping permission check");
      setLoading(false);
    }
  }, [userId, selectedOrg, checkCurrentUserPermissions]);

  return {
    loading,
    error,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin,
    checkCurrentUserPermissions
  };
};
