
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationUser } from '@/types/organization';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AllUsersList } from '@/components/users/AllUsersList';
import { OrganizationUsersList } from '@/components/users/OrganizationUsersList';
import { OrganizationSelector } from '@/components/users/OrganizationSelector';
import { AddUserDialog } from '@/components/users/AddUserDialog';

export default function UsersManagement() {
  const { isAdmin, user } = useAuth();
  const { currentOrganization, organizations, addUserToOrganization } = useOrganization();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([]);
  const [allUsers, setAllUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (organizations.length > 0) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations]);

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
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          profiles (
            id,
            email,
            display_name,
            avatar_url,
            created_at
          ),
          user_roles (
            role
          )
        `)
        .eq('organization_id', selectedOrg);

      if (error) throw error;

      const { data: invitationsData, error: invitationsError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', selectedOrg)
        .eq('status', 'pending');

      if (invitationsError) throw invitationsError;

      const formattedUsers: OrganizationUser[] = (data || [])
        .filter(item => item && typeof item === 'object' && item.profiles)
        .map(item => {
          const profile = item.profiles as Record<string, any> | null;
          const roles = Array.isArray(item.user_roles) ? item.user_roles : [];
          const role = roles.length > 0 ? (roles[0] as Record<string, any>).role : 'user';
          
          if (!profile) return null;
          
          return {
            id: profile?.id || '',
            email: profile?.email || '',
            displayName: profile?.display_name || profile?.email?.split('@')[0] || '',
            avatarUrl: profile?.avatar_url || '',  // Provide empty string as default
            role: (role as 'admin' | 'user'),
            createdAt: profile?.created_at || new Date().toISOString(),
            isPending: false
          };
        })
        .filter((user): user is OrganizationUser => user !== null);

      const pendingUsers: OrganizationUser[] = (invitationsData || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        displayName: invite.email.split('@')[0] || '',
        avatarUrl: '',  // Provide empty string as default
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
        .select(`
          id,
          email,
          display_name,
          avatar_url,
          created_at,
          user_roles (
            role
          )
        `);

      if (error) throw error;

      const formattedUsers: OrganizationUser[] = (data || [])
        .filter(item => item && typeof item === 'object')
        .map(item => {
          const roles = Array.isArray(item.user_roles) ? item.user_roles : [];
          const role = roles.length > 0 ? (roles[0] as Record<string, any>).role : 'user';
          
          return {
            id: item.id || '',
            email: item.email || '',
            displayName: item.display_name || item.email?.split('@')[0] || '',
            avatarUrl: item.avatar_url || '', // Ensure default value for required property
            role: (role as 'admin' | 'user'),
            createdAt: item.created_at || new Date().toISOString(),
            isPending: false // Add the required isPending property
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

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="container p-4 sm:p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-lg text-muted-foreground">
              Vous n'avez pas les droits pour accéder à cette page.
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des utilisateurs</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tous les utilisateurs</CardTitle>
            <CardDescription>Gérez les rôles des utilisateurs dans le système</CardDescription>
          </CardHeader>
          <CardContent>
            <AllUsersList users={allUsers} fetchUsers={fetchAllUsers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Utilisateurs par organisation</CardTitle>
              <CardDescription>Gérez les utilisateurs pour chaque organisation</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <OrganizationSelector 
                organizations={organizations}
                selectedOrg={selectedOrg}
                onSelectOrg={setSelectedOrg}
              />
              
              <AddUserDialog onAddUser={addUserToOrg} loading={loading} />
            </div>
          </CardHeader>
          <CardContent>
            <OrganizationUsersList
              users={orgUsers}
              fetchUsers={fetchUsers}
              organizationId={selectedOrg || ''}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
