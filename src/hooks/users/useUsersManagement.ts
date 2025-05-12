
import { useState, useEffect, useCallback, useRef } from 'react';
import { OrganizationUser } from '@/types/organization';
import { toast } from 'sonner';
import { 
  fetchOrganizationUsers, 
  addUserToOrganization 
} from '@/services/organization/userManagement';
import { supabase } from '@/integrations/supabase/client';

export const useUsersManagement = (selectedOrg: string | null) => {
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([]);
  const [allUsers, setAllUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgUsersLoading, setOrgUsersLoading] = useState(false);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const lastFetchedOrgRef = useRef<string | null>(null);
  const fetchingOrgUsersRef = useRef(false);
  const fetchingAllUsersRef = useRef(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!selectedOrg) return;
    if (fetchingOrgUsersRef.current) {
      console.log("Already fetching org users, skipping duplicate request");
      return;
    }
    
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setOrgUsersLoading(true);
    fetchingOrgUsersRef.current = true;
    
    try {
      console.log(`Fetching users for organization: ${selectedOrg}`);
      const users = await fetchOrganizationUsers(selectedOrg);
      
      if (isMountedRef.current) {
        setOrgUsers(users);
        lastFetchedOrgRef.current = selectedOrg;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch operation was aborted');
        return;
      }
      console.error('Error fetching organization users:', error);
      if (isMountedRef.current) {
        toast.error("Erreur lors de la récupération des utilisateurs: " + (error.message || "Erreur inconnue"));
      }
    } finally {
      if (isMountedRef.current) {
        setOrgUsersLoading(false);
      }
      fetchingOrgUsersRef.current = false;
    }
  }, [selectedOrg]);

  const fetchAllUsers = useCallback(async () => {
    if (fetchingAllUsersRef.current) {
      console.log("Already fetching all users, skipping duplicate request");
      return;
    }
    
    setAllUsersLoading(true);
    fetchingAllUsersRef.current = true;
    
    try {
      console.log("Fetching all users");
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      if (isMountedRef.current) {
        const formattedUsers: OrganizationUser[] = (data || [])
          .map(profile => {
            const userRoles = rolesData?.filter(r => r.user_id === profile.id) || [];
            const role = userRoles.length > 0 ? userRoles[0].role : 'user';
            
            return {
              id: profile.id || '',
              email: profile.email || '',
              displayName: profile.display_name || profile.email?.split('@')[0] || '',
              avatarUrl: profile.avatar_url || '', 
              role: (role as 'admin' | 'user'),
              createdAt: profile.created_at || new Date().toISOString(),
              isPending: false,
              isOrgAdmin: false,
              isSuperAdmin: false
            };
          });

        setAllUsers(formattedUsers);
      }
    } catch (error: any) {
      console.error('Error fetching all users:', error);
      if (isMountedRef.current) {
        toast.error("Erreur lors de la récupération des utilisateurs: " + (error.message || "Erreur inconnue"));
      }
    } finally {
      if (isMountedRef.current) {
        setAllUsersLoading(false);
      }
      fetchingAllUsersRef.current = false;
    }
  }, []);

  // Fetch org users when selectedOrg changes
  useEffect(() => {
    if (selectedOrg) {
      if (selectedOrg !== lastFetchedOrgRef.current) {
        console.log(`Organization changed from ${lastFetchedOrgRef.current} to ${selectedOrg}, fetching users`);
        fetchUsers();
      }
    } else {
      // Clear org users if no org is selected
      setOrgUsers([]);
      lastFetchedOrgRef.current = null;
    }
  }, [selectedOrg, fetchUsers]);

  // Only fetch all users when explicitly requested, not automatically on mount
  const loadAllUsers = useCallback(() => {
    if (allUsers.length === 0 && !allUsersLoading && !fetchingAllUsersRef.current) {
      fetchAllUsers();
    }
  }, [allUsers.length, allUsersLoading, fetchAllUsers]);

  const addUserToOrg = async (email: string) => {
    if (!selectedOrg || !email) return;
    
    setLoading(true);
    try {
      await addUserToOrganization(email, selectedOrg);
      if (isMountedRef.current) {
        await fetchUsers();
      }
    } catch (error: any) {
      console.error('Error adding user to organization:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refreshAllData = useCallback(async () => {
    const promises = [];
    
    if (selectedOrg) {
      // Reset the lastFetchedOrgRef to force a fresh fetch
      lastFetchedOrgRef.current = null;
      promises.push(fetchUsers());
    }
    
    if (allUsers.length > 0) {
      promises.push(fetchAllUsers());
    }
    
    await Promise.all(promises);
  }, [selectedOrg, fetchUsers, fetchAllUsers, allUsers.length]);

  return {
    orgUsers,
    allUsers,
    loading,
    orgUsersLoading,
    allUsersLoading,
    fetchUsers,
    fetchAllUsers,
    loadAllUsers,
    addUserToOrg,
    refreshAllData
  };
};
