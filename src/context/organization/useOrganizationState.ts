
import { useState } from 'react';
import { useUserSession } from '@/hooks/auth/useUserSession'; 
import { Organization, OrganizationUser } from '@/types/organization';
import { useOrganizationLoading } from './state/useOrganizationLoading';
import { useOrganizationCRUD } from './state/useOrganizationCRUD';
import { useOrganizationUsers } from './state/useOrganizationUsers';
import { useOrganizationPermissions } from './state/useOrganizationPermissions';

export function useOrganizationState() {
  const { session, userDetails, isLoading: sessionLoading } = useUserSession();
  const [isLoading, setIsLoading] = useState(true);
  
  // Organization loading and selection
  const {
    organizations,
    setOrganizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading: orgsLoading,
    loadOrganizations,
    changeOrganization,
    error
  } = useOrganizationLoading(session);
  
  // Organization CRUD operations
  const {
    createOrganization,
    updateOrganization,
    deleteOrganization
  } = useOrganizationCRUD(session, setOrganizations, setCurrentOrganization, organizations);
  
  // Organization users management
  const {
    users,
    loadOrganizationUsers,
    addUser,
    removeUser,
    updateUser
  } = useOrganizationUsers();
  
  // User permissions
  const {
    userHasAdminAccessToCurrentOrg,
    checkUserAccess
  } = useOrganizationPermissions();
  
  // Handle organization change with additional side effects
  const handleChangeOrganization = (organizationId: string) => {
    const org = changeOrganization(organizationId);
    if (org && session?.user?.id) {
      loadOrganizationUsers(org.id);
      checkUserAccess(session.user.id, org.id);
    }
  };
  
  // Ensure users are loaded when the current organization changes
  if (currentOrganization && users.length === 0 && !isLoading && !orgsLoading) {
    loadOrganizationUsers(currentOrganization.id);
    if (session?.user?.id) {
      checkUserAccess(session.user.id, currentOrganization.id);
    }
  }
  
  // Adapt addUser function to match expected interface
  const adaptedAddUser = (email: string, role?: string) => {
    if (!currentOrganization) return Promise.reject(new Error("No organization selected"));
    return addUser(email, currentOrganization.id, role);
  };
  
  // Adapt removeUser function to match expected interface
  const adaptedRemoveUser = (userId: string) => {
    if (!currentOrganization) return Promise.reject(new Error("No organization selected"));
    return removeUser(userId, currentOrganization.id);
  };
  
  // Adapt updateUser function to match expected interface
  const adaptedUpdateUser = (userId: string, role: string) => {
    if (!currentOrganization) return Promise.reject(new Error("No organization selected"));
    return updateUser(userId, role, currentOrganization.id);
  };

  return {
    currentOrganization,
    organizations,
    users,
    changeOrganization: handleChangeOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addUser: adaptedAddUser,
    removeUser: adaptedRemoveUser,
    updateUser: adaptedUpdateUser,
    isLoading: orgsLoading || sessionLoading,
    error,
    loadOrganizations,
    userHasAdminAccessToCurrentOrg
  };
}
