
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Check if the current user is a super admin or an organization admin
  const checkCurrentUserPermissions = useCallback(async () => {
    if (!userId) {
      console.log("[useAdminRoles] No user ID, defaulting to not admin");
      setCurrentUserIsOrgAdmin(false);
      setCurrentUserIsSuperAdmin(false);
      setLoading(false);
      setIsInitialized(true);
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
      setIsInitialized(true);
      setError(null);
      
      // Reset check count on success
      setCheckCount(0);
      
      return { isSuperAdmin, isOrgAdmin };
    } catch (error: any) {
      console.error("[useAdminRoles] Error checking admin permissions:", error);
      setError(error);
      
      // Only show toast after multiple failures to avoid spamming
      if (checkCount >= 2) {
        toast.error("Erreur lors de la vérification des permissions: " + error.message);
      }
      
      // Increment check count for retry logic
      setCheckCount(prev => prev + 1);
      
      return { isSuperAdmin: false, isOrgAdmin: false };
    } finally {
      setLoading(false);
    }
  }, [userId, selectedOrg, checkCount]);

  // Reset initialization when dependencies change
  useEffect(() => {
    if (isInitialized && (userId || selectedOrg)) {
      setIsInitialized(false);
      setCheckCount(0);
    }
  }, [userId, selectedOrg, isInitialized]);

  // Check permissions when component mounts or dependencies change
  useEffect(() => {
    if (!isInitialized && (userId || selectedOrg)) {
      console.log("[useAdminRoles] Dependencies changed, checking permissions");
      
      // Add a slight delay for retries to prevent flooding
      const delayMs = checkCount > 0 ? 1000 * checkCount : 0;
      
      const timer = setTimeout(() => {
        checkCurrentUserPermissions();
      }, delayMs);
      
      return () => clearTimeout(timer);
    } else if (!userId && !selectedOrg) {
      console.log("[useAdminRoles] Missing userId and selectedOrg, skipping permission check");
      setLoading(false);
    }
  }, [userId, selectedOrg, checkCurrentUserPermissions, isInitialized, checkCount]);

  return {
    loading,
    error,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin,
    checkCurrentUserPermissions
  };
};
