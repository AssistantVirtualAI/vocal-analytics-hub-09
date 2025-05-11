
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
  
  const STORAGE_KEY = 'current_organization_id';
  
  // Load organizations
  const loadOrganizations = useCallback(async (): Promise<Organization[]> => {
    if (!session?.user) return [];
    
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
      
      return orgs; // Return the array of orgs directly to match the expected return type
    } catch (error: any) {
      console.error("Failed to load organizations:", error);
      setError(error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      });
      return []; // Return empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  // Change current organization
  const changeOrganization = useCallback((organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem(STORAGE_KEY, organizationId);
      return org;
    }
    return null;
  }, [organizations]);
  
  // Load organizations on session change
  useEffect(() => {
    if (session?.user) {
      console.log("[useOrganizationLoading] Session changed, loading organizations");
      loadOrganizations();
    } else {
      console.log("[useOrganizationLoading] No session, not loading organizations");
    }
  }, [session, loadOrganizations]);
  
  return {
    organizations,
    setOrganizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading,
    error,
    loadOrganizations,
    changeOrganization
  };
};
