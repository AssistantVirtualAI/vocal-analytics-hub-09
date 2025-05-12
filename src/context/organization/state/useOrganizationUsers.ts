
import { useCallback, useState, useRef, useEffect } from 'react';
import { useOrganizationUsersLoading } from '@/hooks/organization/useOrganizationUsersLoading';
import { useUserAddition } from '@/hooks/organization/useUserAddition';
import { useUserRemoval } from '@/hooks/organization/useUserRemoval';
import { useUserRoleUpdate } from '@/hooks/organization/useUserRoleUpdate';

export const useOrganizationUsers = () => {
  // Keep track of the last loaded organization to prevent unnecessary reloads
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const operationInProgressRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  
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

  // Memoized version of loadOrganizationUsers that prevents redundant calls
  const safeLoadOrganizationUsers = useCallback((orgId: string) => {
    if (!orgId) {
      console.log('No organization ID provided for loading users');
      return;
    }
    
    // Only load if this is a different org or we have no users yet
    if (orgId !== currentOrgId || users.length === 0) {
      console.log(`Loading users for organization: ${orgId} (current: ${currentOrgId})`);
      loadOrganizationUsers(orgId);
      setCurrentOrgId(orgId);
    } else {
      console.log(`Skipping load - already loaded users for org: ${orgId}`);
    }
  }, [currentOrgId, loadOrganizationUsers, users.length]);

  // Cleanup function for when the component unmounts
  useEffect(() => {
    return () => {
      console.log('useOrganizationUsers hook cleanup');
      isInitialLoadRef.current = true;
    };
  }, []);

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
