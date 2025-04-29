
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Organization, OrganizationUser, OrganizationInvitation } from '@/types/organization';
import { DEFAULT_ORGANIZATION_ID } from '@/config/organizations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  users: OrganizationUser[];
  changeOrganization: (organizationId: string) => void;
  createOrganization: (organization: Omit<Organization, 'id' | 'createdAt'>) => Promise<void>;
  updateOrganization: (organization: Organization) => Promise<void>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  addUserToOrganization: (email: string, organizationId: string) => Promise<void>;
  removeUserFromOrganization: (userId: string, organizationId: string) => Promise<void>;
  setUserRole: (userId: string, role: 'admin' | 'user') => Promise<void>;
  fetchOrganizationUsers: (organizationId: string) => Promise<void>;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: null,
  organizations: [],
  users: [],
  changeOrganization: () => {},
  createOrganization: async () => {},
  updateOrganization: async () => {},
  deleteOrganization: async () => {},
  addUserToOrganization: async () => {},
  removeUserFromOrganization: async () => {},
  setUserRole: async () => {},
  fetchOrganizationUsers: async () => {},
  isLoading: true,
});

export const useOrganization = () => useContext(OrganizationContext);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string>(
    localStorage.getItem('currentOrganizationId') || DEFAULT_ORGANIZATION_ID
  );
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    } else {
      setIsLoading(false);
      setOrganizations([]);
    }
  }, [user]);

  useEffect(() => {
    if (organizations.length > 0) {
      const org = organizations.find(org => org.id === currentOrganizationId);
      setCurrentOrganization(org || organizations[0]);
      
      if (org) {
        fetchOrganizationUsers(org.id);
      }
    } else {
      setCurrentOrganization(null);
    }
  }, [organizations, currentOrganizationId]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('organizations').select('*');
      
      // If not admin, only fetch organizations the user has access to
      if (!isAdmin && user) {
        query = supabase
          .from('organizations')
          .select('*')
          .in('id', (await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', user.id)).data?.map(item => item.organization_id) || []);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match our Organization type
      const formattedOrganizations = data.map(org => ({
        id: org.id,
        name: org.name,
        agentId: org.agent_id,
        description: org.description,
        createdAt: org.created_at,
      }));
      
      setOrganizations(formattedOrganizations);
      
      // If no current organization is set or it doesn't exist anymore, set the first one
      if (formattedOrganizations.length > 0 && 
          !formattedOrganizations.some(org => org.id === currentOrganizationId)) {
        changeOrganization(formattedOrganizations[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast("Erreur lors de la récupération des organisations: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizationUsers = async (organizationId: string) => {
    if (!organizationId) return;
    
    try {
      // Get all users for this organization using a join
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
        .eq('organization_id', organizationId);

      if (error) throw error;

      // Get pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending');

      if (invitationsError) throw invitationsError;

      // Make sure data is not null and properly structured
      const formattedUsers: OrganizationUser[] = (data || [])
        .filter(item => item && typeof item === 'object' && item.profiles)
        .map(item => {
          // Safely access properties with type checking
          const profile = item.profiles as Record<string, any> | null;
          const roles = Array.isArray(item.user_roles) ? item.user_roles : [];
          const role = roles.length > 0 ? (roles[0] as Record<string, any>).role : 'user';
          
          if (!profile) return null; // Skip users with no profile
          
          return {
            id: profile?.id || '',
            email: profile?.email || '',
            displayName: profile?.display_name || profile?.email?.split('@')[0] || '',
            avatarUrl: profile?.avatar_url,
            role: (role as 'admin' | 'user'),
            createdAt: profile?.created_at || new Date().toISOString(),
          };
        })
        .filter((user): user is OrganizationUser => user !== null);

      // Add pending invitations to the list
      const pendingUsers: OrganizationUser[] = (invitationsData || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        displayName: invite.email.split('@')[0] || '',
        role: 'user' as const,
        createdAt: invite.created_at,
        isPending: true
      }));

      setUsers([...formattedUsers, ...pendingUsers]);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    }
  };

  const changeOrganization = (organizationId: string) => {
    localStorage.setItem('currentOrganizationId', organizationId);
    setCurrentOrganizationId(organizationId);
  };

  const createOrganization = async (organization: Omit<Organization, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: organization.name,
          agent_id: organization.agentId,
          description: organization.description
        })
        .select()
        .single();

      if (error) throw error;

      // If the user is not an admin, add them to the organization
      if (!isAdmin && user) {
        const { error: linkError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: user.id,
            organization_id: data.id
          });
          
        if (linkError) throw linkError;
      }

      toast("Organisation créée avec succès.");

      // Refresh organizations list
      await fetchOrganizations();
      
      // Switch to the new organization
      changeOrganization(data.id);
      
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast("Erreur lors de la création de l'organisation: " + error.message);
      throw error;
    }
  };

  const updateOrganization = async (organization: Organization) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: organization.name,
          agent_id: organization.agentId,
          description: organization.description
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast("Organisation mise à jour avec succès.");

      // Refresh organizations list
      await fetchOrganizations();
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast("Erreur lors de la mise à jour de l'organisation: " + error.message);
      throw error;
    }
  };

  const deleteOrganization = async (organizationId: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;

      toast("Organisation supprimée avec succès.");

      // Refresh organizations list
      await fetchOrganizations();
      
      // If the current organization was deleted, switch to another one
      if (currentOrganizationId === organizationId && organizations.length > 0) {
        const remainingOrgs = organizations.filter(org => org.id !== organizationId);
        if (remainingOrgs.length > 0) {
          changeOrganization(remainingOrgs[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      toast("Erreur lors de la suppression de l'organisation: " + error.message);
      throw error;
    }
  };

  const addUserToOrganization = async (email: string, organizationId: string) => {
    try {
      // First, check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (userError) throw userError;
      
      if (!userData) {
        // User doesn't exist, create an invitation entry
        const { error: inviteError } = await supabase
          .from('organization_invitations')
          .insert({
            email: email,
            organization_id: organizationId,
            status: 'pending'
          });

        if (inviteError) {
          // Check if it's a duplicate invitation error
          if (inviteError.code === '23505') { // PostgreSQL unique constraint violation
            toast(`Une invitation pour ${email} est déjà en attente.`);
            return;
          }
          throw inviteError;
        }

        toast(`Invitation envoyée à ${email}. Ils seront ajoutés à l'organisation après inscription.`);
        return;
      }

      // Check if user already in organization
      const { data: existingLink, error: linkCheckError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (linkCheckError) throw linkCheckError;
      
      if (existingLink) {
        throw new Error(`L'utilisateur est déjà membre de cette organisation.`);
      }

      // Add user to organization
      const { error: addError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userData.id,
          organization_id: organizationId
        });

      if (addError) throw addError;

      toast(`${email} a été ajouté à l'organisation avec succès.`);

      // Refresh users list
      await fetchOrganizationUsers(organizationId);
    } catch (error: any) {
      console.error('Error adding user to organization:', error);
      toast("Erreur lors de l'ajout de l'utilisateur: " + error.message);
      throw error;
    }
  };

  const removeUserFromOrganization = async (userId: string, organizationId: string) => {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      toast("L'utilisateur a été retiré de l'organisation avec succès.");

      // Refresh users list
      await fetchOrganizationUsers(organizationId);
    } catch (error: any) {
      console.error('Error removing user from organization:', error);
      toast("Erreur lors du retrait de l'utilisateur: " + error.message);
      throw error;
    }
  };

  const setUserRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      // Check if role already exists
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', role)
        .maybeSingle();

      if (roleCheckError) throw roleCheckError;
      
      if (existingRole) {
        // Role already set
        return;
      }

      // Remove existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add new role
      const { error: addError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (addError) throw addError;

      toast("Le rôle de l'utilisateur a été mis à jour avec succès.");

      if (currentOrganization) {
        await fetchOrganizationUsers(currentOrganization.id);
      }
    } catch (error: any) {
      console.error('Error setting user role:', error);
      toast("Erreur lors de la mise à jour du rôle: " + error.message);
      throw error;
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        users,
        changeOrganization,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        addUserToOrganization,
        removeUserFromOrganization,
        setUserRole,
        fetchOrganizationUsers,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
