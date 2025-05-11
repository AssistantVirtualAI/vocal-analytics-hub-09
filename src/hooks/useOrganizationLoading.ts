
import { useState, useCallback, useEffect } from 'react';
import { Organization } from '@/types/organization';
import { fetchAllOrganizations, fetchUserOrganizations } from '@/services/organization/fetchOrganizations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationLoading = (isAdmin: boolean, userId?: string) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const loadOrganizations = useCallback(async (): Promise<Organization[]> => {
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
      return orgs || [];
    } catch (error: any) {
      console.error('[useOrganizationLoading] Error fetching organizations:', error);
      setError(error);
      // Only show toast error once
      toast.error("Erreur lors de la récupération des organisations: " + error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, userId]);

  // Add an effect to load organizations when the component mounts or when retrying
  useEffect(() => {
    if (!initialized && (userId || isAdmin)) {
      console.log("[useOrganizationLoading] Initial load or retry triggered for user:", userId, "retry count:", retryCount);
      loadOrganizations().then(orgs => {
        if (orgs.length === 0 && retryCount < 3) {
          // If no organizations found, retry a few times (could be timing issues)
          const timer = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000); // Wait 2 seconds before retrying
          return () => clearTimeout(timer);
        }
      });
    } else {
      console.log("[useOrganizationLoading] Initialized or missing user info, skipping load");
      if (!userId && !isAdmin) {
        setIsLoading(false);
      }
    }
  }, [userId, isAdmin, loadOrganizations, retryCount, initialized]);
  
  // Reset initialized state when dependencies change
  useEffect(() => {
    setInitialized(false);
  }, [userId, isAdmin]);

  return {
    organizations,
    setOrganizations,
    isLoading,
    error,
    loadOrganizations,
    retryCount
  };
};
