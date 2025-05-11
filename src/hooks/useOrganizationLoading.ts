
import { useState, useCallback, useEffect } from 'react';
import { Organization } from '@/types/organization';
import { fetchAllOrganizations, fetchUserOrganizations } from '@/services/organization/fetchOrganizations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationLoading = (isAdmin: boolean, userId?: string) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

      if (orgs.length === 0) {
        console.log('[useOrganizationLoading] No organizations found for user');
        if (!isAdmin) {
          toast.info("Vous n'appartenez à aucune organisation. Contactez un administrateur pour être ajouté.");
        }
      }
          
      setOrganizations(orgs);
      return orgs;
    } catch (error: any) {
      console.error('[useOrganizationLoading] Error fetching organizations:', error);
      setError(error);
      toast.error("Erreur lors de la récupération des organisations: " + error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, userId]);

  // Add an effect to load organizations when the component mounts
  useEffect(() => {
    if (userId || isAdmin) {
      console.log("[useOrganizationLoading] Initial load triggered for user:", userId);
      loadOrganizations();
    } else {
      console.log("[useOrganizationLoading] No user ID available, skipping initial load");
      setIsLoading(false);
    }
  }, [userId, isAdmin, loadOrganizations]);

  return {
    organizations,
    setOrganizations,
    isLoading,
    error,
    loadOrganizations
  };
};
