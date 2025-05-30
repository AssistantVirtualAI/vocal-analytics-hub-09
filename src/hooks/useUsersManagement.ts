
import { useState, useEffect, useCallback } from 'react';
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

  const fetchUsers = useCallback(async () => {
    if (!selectedOrg) return;
    
    setOrgUsersLoading(true);
    try {
      const users = await fetchOrganizationUsers(selectedOrg);
      setOrgUsers(users);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setOrgUsersLoading(false);
    }
  }, [selectedOrg]);

  const fetchAllUsers = useCallback(async () => {
    setAllUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

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
            isOrgAdmin: false, // Adding the missing property
            isSuperAdmin: false // Adding the missing property
          };
        });

      setAllUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching all users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setAllUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchUsers();
    }
  }, [selectedOrg, fetchUsers]);

  // Only fetch all users when explicitly requested, not automatically on mount
  const loadAllUsers = useCallback(() => {
    if (allUsers.length === 0) {
      fetchAllUsers();
    }
  }, [allUsers.length, fetchAllUsers]);

  const addUserToOrg = async (email: string) => {
    if (!selectedOrg || !email) return;
    
    setLoading(true);
    try {
      await addUserToOrganization(email, selectedOrg);
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error adding user to organization:', error);
      // Don't toast here, the function already does it
    } finally {
      setLoading(false);
    }
  };

  return {
    orgUsers,
    allUsers,
    loading,
    orgUsersLoading,
    allUsersLoading,
    fetchUsers,
    fetchAllUsers,
    loadAllUsers,
    addUserToOrg
  };
};
