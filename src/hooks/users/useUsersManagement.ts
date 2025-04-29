
import { useCallback } from 'react';
import { useOrganizationUsersFetching } from './useOrganizationUsersFetching';
import { useAllUsersFetching } from './useAllUsersFetching';
import { useUserOrganizationManagement } from './useUserOrganizationManagement';

export const useUsersManagement = (selectedOrg: string | null) => {
  const { 
    users: orgUsers, 
    loading: orgUsersLoading, 
    fetchUsers 
  } = useOrganizationUsersFetching(selectedOrg);
  
  const { 
    users: allUsers, 
    loading: allUsersLoading,
    loadAllUsers,
    fetchAllUsers
  } = useAllUsersFetching();

  const { 
    loading: addUserLoading, 
    addUserToOrg 
  } = useUserOrganizationManagement(selectedOrg, fetchUsers);

  // Combine loadings for a single loading state
  const loading = addUserLoading;

  // Function to add a user and refresh the list
  const addUser = useCallback(async (email: string) => {
    if (!selectedOrg) return;
    await addUserToOrg(email);
    // The fetchUsers call is handled within the addUserToOrg function
  }, [selectedOrg, addUserToOrg]);

  return {
    orgUsers,
    allUsers,
    loading,
    orgUsersLoading,
    allUsersLoading,
    fetchUsers,
    fetchAllUsers,
    loadAllUsers,
    addUserToOrg: addUser
  };
};
