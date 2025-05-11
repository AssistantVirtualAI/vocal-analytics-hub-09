
import { useCallback } from 'react';
import { useOrganizationUsersLoading } from '@/hooks/organization/useOrganizationUsersLoading';
import { useUserAddition } from '@/hooks/organization/useUserAddition';
import { useUserRemoval } from '@/hooks/organization/useUserRemoval';
import { useUserRoleUpdate } from '@/hooks/organization/useUserRoleUpdate';

export const useOrganizationUsers = () => {
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
  }, [addUser, loadOrganizationUsers]);

  // Remove a user from organization and refresh data
  const removeUserWithRefresh = useCallback(async (userId: string, orgId: string): Promise<void> => {
    await removeUser(userId, orgId);
    await loadOrganizationUsers(orgId);
  }, [removeUser, loadOrganizationUsers]);

  // Update a user's role and refresh data
  const updateUserRoleWithRefresh = useCallback(async (userId: string, role: string, orgId: string): Promise<void> => {
    await updateUserRole(userId, role, orgId);
    await loadOrganizationUsers(orgId);
  }, [updateUserRole, loadOrganizationUsers]);

  const loading = usersLoading || addLoading || removeLoading || updateLoading;

  return {
    users,
    loading,
    loadOrganizationUsers,
    addUser: addUserWithRefresh,
    removeUser: removeUserWithRefresh,
    updateUser: updateUserRoleWithRefresh
  };
};
