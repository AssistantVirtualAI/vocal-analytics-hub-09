
import { useState, useCallback, useEffect } from 'react';
import { Organization } from '@/types/organization';
import { fetchAllOrganizations, fetchUserOrganizations } from '@/services/organization/fetchOrganizations';
import { toast } from 'sonner';

export const useOrganizationLoading = (isAdmin: boolean, userId?: string) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const loadOrganizations = useCallback(async (): Promise<Organization[]> => {
    if (isLoading && retryCount > 0) {
      // Don't start a new request if we're already loading and have retried
      return organizations;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[useOrganizationLoading] Loading organizations for user:", userId, "isAdmin:", isAdmin);
      
      if (!userId && !isAdmin) {
        console.log('[useOrganizationLoading] No user ID or admin privilege, returning empty array');
        setIsLoading(false);
        return [];
      }
      
      let orgs: Organization[] = [];
      
      if (isAdmin) {
        // Super admins can see all organizations
        orgs = await fetchAllOrganizations();
        console.log('[useOrganizationLoading] Admin user - fetched all organizations:', orgs);
      } else if (userId) {
        // Regular users can only see their organizations
        orgs = await fetchUserOrganizations(userId);
        console.log('[useOrganizationLoading] Regular user - fetched user organizations:', orgs);
      }

      // Don't treat empty organizations as an error condition
      setOrganizations(orgs || []);
      setInitialized(true);
      setRetryCount(0); // Reset retry count on success
      return orgs || [];
    } catch (error: any) {
      console.error('[useOrganizationLoading] Error fetching organizations:', error);
      setError(error);
      
      // Only show toast error on the first attempt or after several retries
      if (retryCount === 0 || retryCount > 2) {
        toast.error("Erreur lors de la récupération des organisations: " + error.message);
      }
      return organizations; // Return current state on error
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, userId, organizations, isLoading, retryCount]);

  // Add an effect to load organizations when the component mounts or when retrying
  useEffect(() => {
    // Only load if not initialized or if we're retrying
    if ((!initialized || retryCount > 0) && (userId || isAdmin)) {
      console.log("[useOrganizationLoading] Initial load or retry triggered for user:", userId, "retry count:", retryCount);
      
      // Use a debounce for retries to prevent too many requests
      const loadTimer = setTimeout(() => {
        loadOrganizations().then(orgs => {
          if (orgs.length === 0 && retryCount < 3 && !error) {
            // If no organizations found and no error occurred, retry a few times (could be timing issues)
            const retryTimer = setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000); // Wait 2 seconds before retrying
            return () => clearTimeout(retryTimer);
          }
        });
      }, retryCount > 0 ? 1000 : 0); // No delay for first load, delay for retries
      
      return () => clearTimeout(loadTimer);
    } else {
      console.log("[useOrganizationLoading] Initialized or missing user info, skipping load");
      if (!userId && !isAdmin) {
        setIsLoading(false);
      }
    }
  }, [userId, isAdmin, loadOrganizations, retryCount, initialized, error]);
  
  // Reset initialized state when dependencies change
  useEffect(() => {
    // Only reset if the dependencies actually changed and we had been initialized
    if ((initialized) && (userId || isAdmin)) {
      setInitialized(false);
      setRetryCount(0);
    }
  }, [userId, isAdmin, initialized]);

  return {
    organizations,
    setOrganizations,
    isLoading,
    error,
    loadOrganizations,
    retryCount
  };
};
