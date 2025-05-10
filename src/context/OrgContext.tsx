
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Organization } from '@/types/organization';
import { toast } from 'sonner';

// Define the context value type explicitly to avoid deep type instantiation issues
interface OrgContextValue {
  currentOrg: Organization | null;
  loading: boolean;
  error: Error | null;
  refetchOrg: () => Promise<void>;
}

// Create the context with the explicit interface
const OrgContext = createContext<OrgContextValue>({
  currentOrg: null,
  loading: true,
  error: null,
  refetchOrg: async () => {},
});

// Export the useOrg hook
export const useOrg = () => useContext(OrgContext);

// Define the provider component props
interface OrgProviderProps {
  children: ReactNode;
}

export const OrgProvider: React.FC<OrgProviderProps> = ({ children }) => {
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
      const { data, error: supabaseError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      if (supabaseError) throw supabaseError;
      
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
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
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

  // Define the refetch function
  const refetchOrg = async () => {
    await fetchOrgBySlug();
  };

  // Create the context value object outside of the JSX to avoid deep instantiation
  const contextValue: OrgContextValue = {
    currentOrg, 
    loading, 
    error, 
    refetchOrg
  };

  return (
    <OrgContext.Provider value={contextValue}>
      {children}
    </OrgContext.Provider>
  );
};
