
import { useEffect } from 'react';
import { Organization } from '@/types/organization';
import { useAuth } from '../AuthContext';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useOrganizationLoading } from '@/hooks/useOrganizationLoading';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useOrganizationOperations } from '@/hooks/useOrganizationOperations';
import { useOrganizationUserManagement } from '@/hooks/useOrganizationUserManagement';

export const useOrganizationState = () => {
  const { users, setUsers } = useOrganizationUsers();
  const { user, isAdmin } = useAuth();
  
  const { 
    organizations, 
    isLoading, 
    loadOrganizations 
  } = useOrganizationLoading(isAdmin, user?.id);
  
  const {
    currentOrganizationId,
    currentOrganization,
    setCurrentOrganization,
    changeOrganization
  } = useCurrentOrganization();
  
  const {
    createOrganization,
    updateOrganization,
    deleteOrganization
  } = useOrganizationOperations(loadOrganizations);
  
  const {
    fetchOrganizationUsers,
    addUserToOrganization,
    removeUserFromOrganization,
    setUserRole
  } = useOrganizationUserManagement(setUsers);

  // Initial load of organizations when user authentication state changes
  useEffect(() => {
    console.log("[useOrganizationState] Auth state changed, user:", user?.id);
    if (user) {
      loadOrganizations();
    } else {
      setUsers([]);
    }
  }, [user?.id]);

  // Effect for updating current organization when organizations list changes
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
