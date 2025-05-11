
import { useState, useEffect, useCallback } from 'react';
import { Organization } from '@/types/organization';
import { fetchOrganizations } from '@/services/organization';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationLoading = (session: any) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const STORAGE_KEY = 'current_organization_id';
  
  // Load organizations
  const loadOrganizations = useCallback(async () => {
    if (!session?.user) return { orgs: [] };
    
    try {
      setIsLoading(true);
      // Pass false as the first argument to indicate not admin by default
      // and user ID as second argument
      const orgs = await fetchOrganizations(false, session.user.id);
      
      if (orgs && orgs.length > 0) {
        setOrganizations(orgs);
        
        // Attempt to load a previously selected organization
        const storedOrgId = localStorage.getItem(STORAGE_KEY);
        let selectedOrg = null;
        
        if (storedOrgId) {
          const foundOrg = orgs.find(org => org.id === storedOrgId);
          if (foundOrg) {
            selectedOrg = foundOrg;
          } else if (orgs.length > 0) {
            // If stored org wasn't found, select first available org
            selectedOrg = orgs[0];
            localStorage.setItem(STORAGE_KEY, orgs[0].id);
          }
        } else if (orgs.length > 0) {
          // No stored org, select first available
          selectedOrg = orgs[0];
          localStorage.setItem(STORAGE_KEY, orgs[0].id);
        }
        
        if (selectedOrg) {
          setCurrentOrganization(selectedOrg);
        }
        
        return { orgs, selectedOrg };
      }
      
      return { orgs: [] };
    } catch (error) {
      console.error("Failed to load organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      });
      return { orgs: [] };
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
      loadOrganizations();
    }
  }, [session, loadOrganizations]);
  
  return {
    organizations,
    setOrganizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading,
    loadOrganizations,
    changeOrganization
  };
};
