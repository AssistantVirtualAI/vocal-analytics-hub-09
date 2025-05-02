
import { useCallback } from 'react';
import { toast } from 'sonner';
import { 
  addUserToOrganization as addUser,
  removeUserFromOrganization as removeUser,
  setUserRole as setRole,
  fetchOrganizationUsers as fetchOrgUsers
} from '@/services/organization';

export const useOrganizationUserManagement = (setUsers: React.Dispatch<React.SetStateAction<any[]>>) => {
  const fetchOrganizationUsers = useCallback(async (organizationId: string) => {
    if (!organizationId) {
      console.log("[useOrganizationUserManagement] No organization ID provided, skipping user fetch");
      return;
    }
    
    try {
      console.log('[useOrganizationUserManagement] Fetching users for organization:', organizationId);
      const orgUsers = await fetchOrgUsers(organizationId);
      console.log('[useOrganizationUserManagement] Fetched organization users:', orgUsers);
      setUsers(orgUsers);
    } catch (error: any) {
      console.error('[useOrganizationUserManagement] Error fetching organization users:', error);
      toast.error("Erreur lors de la récupération des utilisateurs: " + error.message);
    }
  }, [setUsers]);

  const addUserToOrganization = useCallback(async (email: string, organizationId: string) => {
    try {
      console.log(`Adding user ${email} to org ${organizationId}`);
      await addUser(email, organizationId);
      if (organizationId) {
        await fetchOrganizationUsers(organizationId);
        console.log('User added, refreshed organization users');
      }
      toast.success(`Invitation envoyée à ${email}`);
    } catch (error: any) {
      console.error('Error adding user to organization:', error);
      toast.error("Erreur: " + error.message);
      throw error;
    }
  }, [fetchOrganizationUsers]);

  const removeUserFromOrganization = useCallback(async (userId: string, organizationId: string) => {
    try {
      await removeUser(userId, organizationId);
      toast.success("L'utilisateur a été retiré de l'organisation.");
      if (organizationId) {
        await fetchOrganizationUsers(organizationId);
      }
    } catch (error: any) {
      console.error('Error removing user from organization:', error);
      toast.error("Erreur: " + error.message);
      throw error;
    }
  }, [fetchOrganizationUsers]);

  const setUserRole = useCallback(async (userId: string, role: 'admin' | 'user') => {
    try {
      await setRole(userId, role);
      toast.success("Le rôle de l'utilisateur a été mis à jour.");
    } catch (error: any) {
      console.error('Error setting user role:', error);
      toast.error("Erreur: " + error.message);
      throw error;
    }
  }, []);

  return {
    fetchOrganizationUsers,
    addUserToOrganization,
    removeUserFromOrganization,
    setUserRole
  };
};
