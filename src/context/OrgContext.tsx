
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Organization } from '@/types/organization';
import { toast } from 'sonner';

// Define a simple context type without circular references
interface OrgContextType {
  currentOrg: Organization | null;
  loading: boolean;
  error: Error | null;
  refetchOrg: () => Promise<void>;
}

// Create a context with default values
const OrgContext = createContext<OrgContextType>({
  currentOrg: null,
  loading: true,
  error: null,
  refetchOrg: async () => {}
});

export const useOrg = () => useContext(OrgContext);

export const OrgProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Extract the slug from the URL pathname directly
  const location = useLocation();
  const pathSegments = location.pathname.split('/');
  const orgSlug = pathSegments.length > 1 ? pathSegments[1] : null;
  
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Define the function to fetch org by slug
  const fetchOrgBySlug = async () => {
    if (!orgSlug) {
      setCurrentOrg(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching organization with slug: ${orgSlug}`);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      if (error) throw error;
      
      if (!data) {
        setCurrentOrg(null);
        toast.error(`Organisation introuvable: ${orgSlug}`);
      } else {
        // Transform the data to ensure it has the correct shape
        const orgData: Organization = {
          id: data.id,
          name: data.name,
          agentId: data.agent_id,
          description: data.description || undefined,
          createdAt: data.created_at,
          // Use the provided slug from the URL parameter
          slug: orgSlug
        };
        
        setCurrentOrg(orgData);
        console.log(`Found organization: ${data.name}`);
      }
    } catch (err: any) {
      console.error('Error fetching organization:', err);
      setError(err);
      setCurrentOrg(null);
    } finally {
      setLoading(false);
    }
  };

  // Set up effect to fetch the organization when the slug changes
  useEffect(() => {
    if (orgSlug) {
      fetchOrgBySlug();
    } else {
      setCurrentOrg(null);
      setLoading(false);
    }
  }, [orgSlug, location.pathname, user]);

  const refetchOrg = async () => {
    await fetchOrgBySlug();
  };

  return (
    <OrgContext.Provider value={{ currentOrg, loading, error, refetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
};
