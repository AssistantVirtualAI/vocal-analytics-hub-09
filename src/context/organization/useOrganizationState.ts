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
      console.log("[useOrganizationState] Loading organizations for user:", user?.id, "isAdmin:", isAdmin);
      const orgs = await fetchOrganizations(isAdmin, user?.id);
      console.log('[useOrganizationState] Fetched organizations:', orgs);
      
      if (orgs.length > 0) {
        setOrganizations(orgs);
        
        // Check if current org exists in the fetched orgs
        const currentOrgExists = orgs.some(org => org.id === currentOrganizationId);
        if (!currentOrgExists) {
          console.log(`[useOrganizationState] Current organization ${currentOrganizationId} not found in fetched orgs. Selecting first org.`);
          changeOrganization(orgs[0].id);
        } else {
          console.log(`[useOrganizationState] Current organization ${currentOrganizationId} exists in fetched orgs.`);
          // Refresh the current organization to ensure it's up-to-date
          const org = orgs.find(o => o.id === currentOrganizationId);
          setCurrentOrganization(org || null);
          if (org) {
            fetchOrganizationUsers(org.id);
          }
        }
      } else {
        console.log("[useOrganizationState] No organizations found for user");
        setOrganizations([]);
        setCurrentOrganization(null);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('[useOrganizationState] Error fetching organizations:', error);
      toast.error("Erreur lors de la récupération des organisations: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizationUsers = async (organizationId: string) => {
    if (!organizationId) {
      console.log("[useOrganizationState] No organization ID provided, skipping user fetch");
      return;
    }
    
    try {
      console.log('[useOrganizationState] Fetching users for organization:', organizationId);
      const orgUsers = await fetchOrgUsers(organizationId);
      console.log('[useOrganizationState] Fetched organization users:', orgUsers);
      setUsers(orgUsers);
    } catch (error: any) {
      console.error('[useOrganizationState] Error fetching organization users:', error);
      toast.error("Erreur lors de la récupération des utilisateurs: " + error.message);
    }
  };

  const changeOrganization = (organizationId: string) => {
    console.log('[useOrganizationState] Changing organization to:', organizationId);
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
    console.log("[useOrganizationState] Auth state changed, user:", user?.id);
    if (user) {
      loadOrganizations();
    } else {
      setIsLoading(false);
      setOrganizations([]);
      setCurrentOrganization(null);
      setUsers([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (organizations.length > 0 && currentOrganizationId) {
      console.log(`[useOrganizationState] Finding current org (${currentOrganizationId}) in ${organizations.length} organizations`);
      const org = organizations.find(org => org.id === currentOrganizationId);
      
      if (org) {
        console.log(`[useOrganizationState] Found current organization: ${org.name}`);
        setCurrentOrganization(org);
        fetchOrganizationUsers(org.id);
      } else {
        console.log(`[useOrganizationState] Current organization not found, selecting first available org`);
        setCurrentOrganization(organizations[0]);
        changeOrganization(organizations[0].id);
        fetchOrganizationUsers(organizations[0].id);
      }
    } else if (organizations.length > 0) {
      console.log(`[useOrganizationState] No current org ID but organizations exist, selecting first one`);
      setCurrentOrganization(organizations[0]);
      changeOrganization(organizations[0].id);
      fetchOrganizationUsers(organizations[0].id);
    } else {
      console.log(`[useOrganizationState] No organizations available, setting current org to null`);
      setCurrentOrganization(null);
    }
  }, [organizations, currentOrganizationId]);

  return {
    currentOrganization,
    organizations,
    users,
    changeOrganization,
    createOrganization: createNewOrg,
    updateOrganization: updateOrg,
    deleteOrganization: deleteOrg,
    addUserToOrganization: addUser,
    removeUserFromOrganization: removeUser,
    setUserRole: setRole,
    fetchOrganizationUsers,
    isLoading,
  };
};
