
import { useState, useEffect } from 'react';
import { OrganizationUser } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/context/OrganizationContext';

export const useUsersManagement = (selectedOrg: string | null) => {
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([]);
  const [allUsers, setAllUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { addUserToOrganization } = useOrganization();

  useEffect(() => {
    if (selectedOrg) {
      fetchUsers();
      fetchAllUsers();
    }
  }, [selectedOrg]);

  const fetchUsers = async () => {
    if (!selectedOrg) return;
    
    setLoading(true);
    try {
      const { data: orgUserLinks, error: orgUserError } = await supabase
        .from('user_organizations')
        .select('user_id, organization_id')
        .eq('organization_id', selectedOrg);

      if (orgUserError) throw orgUserError;

      const userIds = orgUserLinks?.map(link => link.user_id) || [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

      if (rolesError) throw rolesError;

      const { data: invitationsData, error: invitationsError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', selectedOrg)
        .eq('status', 'pending');

      if (invitationsError) throw invitationsError;

      const formattedUsers: OrganizationUser[] = (profiles || []).map(profile => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.id) || [];
        const role = userRoles.length > 0 ? userRoles[0].role : 'user';
        
        return {
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name || profile.email?.split('@')[0] || '',
          avatarUrl: profile.avatar_url || '',
          role: role as 'admin' | 'user',
          createdAt: profile.created_at,
          isPending: false
        };
      });

      const pendingUsers: OrganizationUser[] = (invitationsData || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        displayName: invite.email.split('@')[0] || '',
        avatarUrl: '',
        role: 'user' as const,
        createdAt: invite.created_at,
        isPending: true
      }));

      setOrgUsers([...formattedUsers, ...pendingUsers]);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
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
            isPending: false
          };
        });

      setAllUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching all users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

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
    fetchUsers,
    fetchAllUsers,
    addUserToOrg
  };
};
