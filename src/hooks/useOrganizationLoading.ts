
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

  const loadOrganizations = useCallback(async (): Promise<Organization[]> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[useOrganizationLoading] Loading organizations for user:", userId, "isAdmin:", isAdmin);
      
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
    if (userId || isAdmin) {
      console.log("[useOrganizationLoading] Initial load or retry triggered for user:", userId, "retry count:", retryCount);
      loadOrganizations().then(orgs => {
        if (orgs.length === 0 && retryCount < 3) {
          // If no organizations found, retry a few times (could be timing issues)
          const timer = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000); // Wait 1 second before retrying
          return () => clearTimeout(timer);
        }
      });
    } else {
      console.log("[useOrganizationLoading] No user ID available, skipping initial load");
      setIsLoading(false);
    }
  }, [userId, isAdmin, loadOrganizations, retryCount]);

  return {
    organizations,
    setOrganizations,
    isLoading,
    error,
    loadOrganizations
  };
};
