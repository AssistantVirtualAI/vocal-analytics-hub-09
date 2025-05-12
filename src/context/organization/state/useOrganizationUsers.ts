import { useCallback, useState } from 'react';
import { useOrganizationUsersLoading } from '@/hooks/organization/useOrganizationUsersLoading';
import { useUserAddition } from '@/hooks/organization/useUserAddition';
import { useUserRemoval } from '@/hooks/organization/useUserRemoval';
import { useUserRoleUpdate } from '@/hooks/organization/useUserRoleUpdate';

export const useOrganizationUsers = () => {
  // Keep track of the last loaded organization to prevent unnecessary reloads
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  
  // Load user data
  const { 
    users, 
    setUsers, 
    loading: usersLoading, 
    loadOrganizationUsers 
  } = useOrganizationUsersLoading();
  
  // User operations hooks
  const { loading: addLoading, addUser } = useUserAddition();
  const { loading: removeLoading, removeUser } = useUserRemoval();
  const { loading: updateLoading, updateUserRole } = useUserRoleUpdate();

  // Add a user to organization and refresh data
  const addUserWithRefresh = useCallback(async (email: string, orgId: string, role?: string): Promise<void> => {
    await addUser(email, orgId, role);
    await loadOrganizationUsers(orgId);
    setCurrentOrgId(orgId);
  }, [addUser, loadOrganizationUsers]);

  // Remove a user from organization and refresh data
  const removeUserWithRefresh = useCallback(async (userId: string, orgId: string): Promise<void> => {
    await removeUser(userId, orgId);
    await loadOrganizationUsers(orgId);
    setCurrentOrgId(orgId);
  }, [removeUser, loadOrganizationUsers]);

  // Update a user's role and refresh data
  const updateUserRoleWithRefresh = useCallback(async (userId: string, role: string, orgId: string): Promise<void> => {
    await updateUserRole(userId, role, orgId);
    await loadOrganizationUsers(orgId);
    setCurrentOrgId(orgId);
  }, [updateUserRole, loadOrganizationUsers]);

  // Safe version of loadOrganizationUsers that prevents redundant calls
  const safeLoadOrganizationUsers = useCallback((orgId: string) => {
    if (orgId !== currentOrgId) {
      loadOrganizationUsers(orgId);
      setCurrentOrgId(orgId);
    }
  }, [currentOrgId, loadOrganizationUsers]);

  const loading = usersLoading || addLoading || removeLoading || updateLoading;

  return {
    users,
    loading,
    loadOrganizationUsers: safeLoadOrganizationUsers,
    addUser: addUserWithRefresh,
    removeUser: removeUserWithRefresh,
    updateUser: updateUserRoleWithRefresh
  };
};
