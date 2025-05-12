
import { useState, useCallback, useRef, useEffect } from 'react';
import { OrganizationUser } from '@/types/organization';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define a type for the Supabase query response
type UserOrgQueryResult = {
  user_id: string;
  is_org_admin: boolean;
  organization_id: string;
  profiles: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export const useOrganizationUsersLoading = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const lastFetchedOrgIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Load organization users
  const loadOrganizationUsers = useCallback(async (orgId: string) => {
    try {
      if (!orgId) {
        console.log('[useOrganizationUsersLoading] No organization ID provided');
        return;
      }
      
      // Skip if we're already loading users for this organization
      if (loadingRef.current && lastFetchedOrgIdRef.current === orgId) {
        console.log(`[useOrganizationUsersLoading] Already loading users for organization: ${orgId}`);
        return;
      }
      
      // Cancel previous request if there was one
      if (abortControllerRef.current) {
        console.log('[useOrganizationUsersLoading] Cancelling previous request');
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      if (isMountedRef.current) {
        setLoading(true);
      }
      loadingRef.current = true;
      lastFetchedOrgIdRef.current = orgId;
      console.log(`[useOrganizationUsersLoading] Fetching users for organization: ${orgId}`);
      
      // Fetch organization users directly from Supabase
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          is_org_admin,
          organization_id,
          profiles:user_id(id, email, display_name, avatar_url)
        `)
        .eq('organization_id', orgId);
      
      if (!isMountedRef.current) return;
      
      if (error) throw error;
      
      if (data) {
        // Cast data to the expected type structure
        const typedData = data as unknown as UserOrgQueryResult[];
        
        const formattedUsers: OrganizationUser[] = typedData.map(item => {
          // Create default user with minimal info
          const defaultUser: OrganizationUser = {
            id: item.user_id,
            email: '',
            displayName: '',
            avatarUrl: '',
            role: item.is_org_admin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            isPending: false,
            isOrgAdmin: !!item.is_org_admin,
            isSuperAdmin: false
          };
          
          // Return default user if profiles is null or invalid
          if (!item.profiles) {
            return defaultUser;
          }
          
          // Otherwise, use profile data with nullish coalescing for safety
          return {
            ...defaultUser,
            email: item.profiles.email ?? '',
            displayName: item.profiles.display_name ?? '',
            avatarUrl: item.profiles.avatar_url ?? '',
          };
        });
        
        console.log(`[useOrganizationUsersLoading] Loaded ${formattedUsers.length} users for org ${orgId}`);
        
        if (isMountedRef.current) {
          setUsers(formattedUsers);
        }
      } else {
        console.log('[useOrganizationUsersLoading] No data returned for org users query');
        if (isMountedRef.current) {
          setUsers([]);
        }
      }
      
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('[useOrganizationUsersLoading] Request was aborted');
        return;
      }
      
      console.error(`[useOrganizationUsersLoading] Error loading users for organization ${orgId}:`, error);
      if (isMountedRef.current) {
        toast({
          title: "Error", 
          description: "Failed to load organization users",
          variant: "destructive"
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, []);

  return {
    users,
    setUsers,
    loading,
    loadOrganizationUsers
  };
};
