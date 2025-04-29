
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Organization } from '@/types/organization';
import { DEFAULT_ORGANIZATION_ID } from '@/config/organizations';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { 
  fetchOrganizations, 
  createOrganization as createNewOrg,
  updateOrganization as updateOrg,
  deleteOrganization as deleteOrg,
  addUserToOrganization as addUser,
  removeUserFromOrganization as removeUser,
  setUserRole as setRole,
  fetchOrganizationUsers as fetchOrgUsers
} from '@/services/organization';

export const useOrganizationState = () => {
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string>(
    localStorage.getItem('currentOrganizationId') || DEFAULT_ORGANIZATION_ID
  );
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const { users, setUsers } = useOrganizationUsers();
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const orgs = await fetchOrganizations(isAdmin, user?.id);
      console.log('Fetched organizations:', orgs);
      setOrganizations(orgs);
      
      if (orgs.length > 0 && !orgs.some(org => org.id === currentOrganizationId)) {
        changeOrganization(orgs[0].id);
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
      console.log('Fetching users for organization:', organizationId);
      const orgUsers = await fetchOrgUsers(organizationId);
      console.log('Fetched organization users:', orgUsers);
      setUsers(orgUsers);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    }
  };

  const changeOrganization = (organizationId: string) => {
    console.log('Changing organization to:', organizationId);
    localStorage.setItem('currentOrganizationId', organizationId);
    setCurrentOrganizationId(organizationId);
  };

  const createOrganization = async (organization: Omit<Organization, 'id' | 'createdAt'>) => {
    try {
      await createNewOrg(organization, isAdmin, user?.id);
      toast("Organisation créée avec succès.");
      await loadOrganizations();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast("Erreur lors de la création de l'organisation: " + error.message);
      throw error;
    }
  };

  const updateOrganization = async (organization: Organization) => {
    try {
      await updateOrg(organization);
      toast("Organisation mise à jour avec succès.");
      await loadOrganizations();
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast("Erreur lors de la mise à jour de l'organisation: " + error.message);
      throw error;
    }
  };

  const deleteOrganization = async (organizationId: string) => {
    try {
      await deleteOrg(organizationId);
      toast("Organisation supprimée avec succès.");
      await loadOrganizations();
      
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
      console.log(`Adding user ${email} to org ${organizationId}`);
      await addUser(email, organizationId);
      if (organizationId === currentOrganization?.id) {
        await fetchOrganizationUsers(organizationId);
        console.log('User added, refreshed organization users');
      }
      toast.success(`Invitation envoyée à ${email}`);
    } catch (error: any) {
      console.error('Error adding user to organization:', error);
      toast.error("Erreur: " + error.message);
      throw error;
    }
  };

  const removeUserFromOrganization = async (userId: string, organizationId: string) => {
    try {
      await removeUser(userId, organizationId);
      toast.success("L'utilisateur a été retiré de l'organisation.");
      if (currentOrganization) {
        await fetchOrganizationUsers(currentOrganization.id);
      }
    } catch (error: any) {
      console.error('Error removing user from organization:', error);
      toast.error("Erreur: " + error.message);
      throw error;
    }
  };

  const setUserRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      await setRole(userId, role);
      toast.success("Le rôle de l'utilisateur a été mis à jour.");
      if (currentOrganization) {
        await fetchOrganizationUsers(currentOrganization.id);
      }
    } catch (error: any) {
      console.error('Error setting user role:', error);
      toast.error("Erreur: " + error.message);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      loadOrganizations();
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

  return {
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
  };
};
