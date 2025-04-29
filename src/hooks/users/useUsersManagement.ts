
import { useCallback } from 'react';
import { useOrganizationUsersFetching } from './useOrganizationUsersFetching';
import { useAllUsersFetching } from './useAllUsersFetching';
import { useUserOrganizationManagement } from './useUserOrganizationManagement';

export const useUsersManagement = (selectedOrg: string | null) => {
  const { 
    users: orgUsers, 
    loading: orgUsersLoading, 
    fetchUsers,
    setUsers: setOrgUsers
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

  // Function to add a user and refresh the list
  const addUser = useCallback(async (email: string) => {
    if (!selectedOrg) return;
    try {
      await addUserToOrg(email);
      // The fetchUsers call is handled within the addUserToOrg function
    } catch (error) {
      console.error("Error in addUser:", error);
    }
  }, [selectedOrg, addUserToOrg]);

  // Force refresh both user lists
  const refreshAllData = useCallback(async () => {
    console.log("Force refreshing all user data");
    if (selectedOrg) {
      await fetchUsers();
    }
    await fetchAllUsers();
  }, [selectedOrg, fetchUsers, fetchAllUsers]);

  return {
    orgUsers,
    allUsers,
    loading: addUserLoading,
    orgUsersLoading,
    allUsersLoading,
    fetchUsers,
    fetchAllUsers,
    loadAllUsers,
    addUserToOrg: addUser,
    refreshAllData
  };
};
