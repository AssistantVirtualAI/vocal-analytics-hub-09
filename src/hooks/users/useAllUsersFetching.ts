
import { useState, useCallback } from 'react';
import { OrganizationUser } from '@/types/organization';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useAllUsersFetching = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
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
            isOrgAdmin: false, // Adding missing property
            isSuperAdmin: false // Adding missing property
          };
        });

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching all users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllUsers = useCallback(() => {
    if (users.length === 0) {
      fetchAllUsers();
    }
  }, [users.length, fetchAllUsers]);

  return {
    users,
    loading,
    fetchAllUsers,
    loadAllUsers
  };
};
