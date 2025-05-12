
import { useCallback, useState, useRef } from 'react';
import { useOrganizationUsersLoading } from '@/hooks/organization/useOrganizationUsersLoading';
import { useUserAddition } from '@/hooks/organization/useUserAddition';
import { useUserRemoval } from '@/hooks/organization/useUserRemoval';
import { useUserRoleUpdate } from '@/hooks/organization/useUserRoleUpdate';

export const useOrganizationUsers = () => {
  // Keep track of the last loaded organization to prevent unnecessary reloads
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const operationInProgressRef = useRef(false);
  
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
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    try {
      await addUser(email, orgId, role);
      await loadOrganizationUsers(orgId);
      setCurrentOrgId(orgId);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [addUser, loadOrganizationUsers]);

  // Remove a user from organization and refresh data
  const removeUserWithRefresh = useCallback(async (userId: string, orgId: string): Promise<void> => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    try {
      await removeUser(userId, orgId);
      await loadOrganizationUsers(orgId);
      setCurrentOrgId(orgId);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [removeUser, loadOrganizationUsers]);

  // Update a user's role and refresh data
  const updateUserRoleWithRefresh = useCallback(async (userId: string, role: string, orgId: string): Promise<void> => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    try {
      await updateUserRole(userId, role, orgId);
      await loadOrganizationUsers(orgId);
      setCurrentOrgId(orgId);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [updateUserRole, loadOrganizationUsers]);

  // Safe version of loadOrganizationUsers that prevents redundant calls
  const safeLoadOrganizationUsers = useCallback((orgId: string) => {
    if (!orgId) return;
    
    if (orgId !== currentOrgId || users.length === 0) {
      console.log(`Loading users for organization: ${orgId} (current: ${currentOrgId})`);
      loadOrganizationUsers(orgId);
      setCurrentOrgId(orgId);
    } else {
      console.log(`Skipping load - already loaded users for org: ${orgId}`);
    }
  }, [currentOrgId, loadOrganizationUsers, users.length]);

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
