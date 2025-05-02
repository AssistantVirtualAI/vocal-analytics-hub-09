
import { useState, useCallback } from 'react';
import { Organization } from '@/types/organization';
import { fetchOrganizations } from '@/services/organization';
import { toast } from 'sonner';

export const useOrganizationLoading = (isAdmin: boolean, userId?: string) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("[useOrganizationLoading] Loading organizations for user:", userId, "isAdmin:", isAdmin);
      const orgs = await fetchOrganizations(isAdmin, userId);
      console.log('[useOrganizationLoading] Fetched organizations:', orgs);
      setOrganizations(orgs);
      return orgs;
    } catch (error: any) {
      console.error('[useOrganizationLoading] Error fetching organizations:', error);
      toast.error("Erreur lors de la récupération des organisations: " + error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, userId]);

  return {
    organizations,
    setOrganizations,
    isLoading,
    loadOrganizations
  };
};
