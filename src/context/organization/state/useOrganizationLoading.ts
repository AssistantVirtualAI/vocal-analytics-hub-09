
import { useState, useEffect, useCallback } from 'react';
import { Organization } from '@/types/organization';
import { fetchOrganizations } from '@/services/organization';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationLoading = (session: any) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const STORAGE_KEY = 'current_organization_id';
  
  // Load organizations
  const loadOrganizations = useCallback(async (): Promise<Organization[]> => {
    if (!session?.user) {
      console.log("[useOrganizationLoading] No session user, returning empty array");
      setIsLoading(false);
      return [];
    }
    
    try {
      setIsLoading(true);
      setError(null);
      // Pass false as the first argument to indicate not admin by default
      // and user ID as second argument
      const orgs = await fetchOrganizations(false, session.user.id);
      
      if (orgs && orgs.length > 0) {
        console.log("[useOrganizationLoading] Setting organizations:", orgs);
        setOrganizations(orgs);
        
        // Attempt to load a previously selected organization
        const storedOrgId = localStorage.getItem(STORAGE_KEY);
        let selectedOrg = null;
        
        if (storedOrgId) {
          console.log("[useOrganizationLoading] Found stored org ID:", storedOrgId);
          const foundOrg = orgs.find(org => org.id === storedOrgId);
          if (foundOrg) {
            console.log("[useOrganizationLoading] Found stored org:", foundOrg);
            selectedOrg = foundOrg;
          } else if (orgs.length > 0) {
            // If stored org wasn't found, select first available org
            console.log("[useOrganizationLoading] Stored org not found, using first org:", orgs[0]);
            selectedOrg = orgs[0];
            localStorage.setItem(STORAGE_KEY, orgs[0].id);
          }
        } else if (orgs.length > 0) {
          // No stored org, select first available
          console.log("[useOrganizationLoading] No stored org, using first org:", orgs[0]);
          selectedOrg = orgs[0];
          localStorage.setItem(STORAGE_KEY, orgs[0].id);
        }
        
        if (selectedOrg) {
          console.log("[useOrganizationLoading] Setting current organization:", selectedOrg);
          setCurrentOrganization(selectedOrg);
        }
      } else {
        console.log("[useOrganizationLoading] No organizations found");
      }
      
      setIsInitialized(true);
      setRetryCount(0); // Reset retry count on success
      return orgs; // Return the array of orgs directly to match the expected return type
    } catch (error: any) {
      console.error("Failed to load organizations:", error);
      setError(error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      });
      
      // Retry loading if we've failed less than 3 times
      if (retryCount < 3) {
        console.log(`[useOrganizationLoading] Retry attempt ${retryCount + 1}/3`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      }
      
      return []; // Return empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [session, retryCount]);
  
  // Change current organization
  const changeOrganization = useCallback((organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      console.log("[useOrganizationLoading] Changing current organization to:", org);
      setCurrentOrganization(org);
      localStorage.setItem(STORAGE_KEY, organizationId);
      return org;
    }
    return null;
  }, [organizations]);
  
  // Load organizations on session change or retry
  useEffect(() => {
    if ((session?.user && !isInitialized) || (session?.user && retryCount > 0)) {
      console.log("[useOrganizationLoading] Session changed or retrying, loading organizations");
      
      // Add a slight delay for retries to prevent flooding
      const delayMs = retryCount > 0 ? 1000 : 0;
      
      const timer = setTimeout(() => {
        loadOrganizations();
      }, delayMs);
      
      return () => clearTimeout(timer);
    } else {
      console.log("[useOrganizationLoading] No session or already initialized, not loading organizations");
      if (!session?.user) {
        setIsLoading(false);
      }
    }
  }, [session, loadOrganizations, retryCount, isInitialized]);
  
  // Reset when session changes
  useEffect(() => {
    if (session?.user?.id) {
      setIsInitialized(false);
      setRetryCount(0);
    }
  }, [session?.user?.id]);
  
  return {
    organizations,
    setOrganizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading,
    error,
    loadOrganizations,
    changeOrganization,
    retryCount
  };
};
