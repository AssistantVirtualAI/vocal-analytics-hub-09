
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
    loading, 
    addUserToOrg 
  } = useUserOrganizationManagement(selectedOrg, fetchUsers);

  return {
    orgUsers,
    allUsers,
    loading,
    orgUsersLoading,
    allUsersLoading,
    fetchUsers,
    fetchAllUsers,
    loadAllUsers,
    addUserToOrg
  };
};
