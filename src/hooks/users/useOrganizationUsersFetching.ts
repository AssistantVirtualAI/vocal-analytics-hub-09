import { useState, useCallback, useEffect } from 'react';
import { OrganizationUser } from '@/types/organization';
import { toast } from 'sonner';
import { fetchOrganizationUsers } from '@/services/organization/users/fetchUsers';
import { 
  checkOrganizationAdminStatus, 
  checkSuperAdminStatus 
} from '@/services/organization/users/adminRoles';

export const useOrganizationUsersFetching = (organizationId: string | null) => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!organizationId) {
      console.log('[useOrganizationUsersFetching] No organization ID provided, skipping user fetch');
      setUsers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`[useOrganizationUsersFetching] Fetching users for organization: ${organizationId}`);
      const fetchedUsers = await fetchOrganizationUsers(organizationId);
      console.log(`[useOrganizationUsersFetching] Fetched ${fetchedUsers.length} users:`, fetchedUsers);
      
      // Reset retry count on success
      setRetryCount(0);
      
      if (fetchedUsers.length === 0) {
        console.log('[useOrganizationUsersFetching] No users found for organization');
        setUsers([]);
        setLoading(false);
        return;
      }
      
      // Enhance users with admin status
      const enhancedUsers = await Promise.all(
        fetchedUsers.map(async (user) => {
          try {
            // Only check admin status for non-pending users
            if (!user.isPending) {
              const isOrgAdmin = await checkOrganizationAdminStatus(user.id, organizationId);
              const isSuperAdmin = await checkSuperAdminStatus(user.id);
              return {
                ...user,
                isOrgAdmin,
                isSuperAdmin
              };
            }
            return user;
          } catch (error) {
            console.error(`[useOrganizationUsersFetching] Error checking admin status for user ${user.id}:`, error);
            return {
              ...user,
              isOrgAdmin: user.isOrgAdmin || false,
              isSuperAdmin: user.isSuperAdmin || false
            };
          }
        })
      );
      
      setUsers(enhancedUsers);
      setError(null);
    } catch (error: any) {
      console.error('[useOrganizationUsersFetching] Error fetching organization users:', error);
      setError(error);
      
      // Only show toast after multiple failures to avoid spamming
      if (retryCount > 1) {
        toast.error("Erreur lors de la récupération des utilisateurs: " + error.message);
      }
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // Keep existing users on error
    } finally {
      setLoading(false);
    }
  }, [organizationId, retryCount]);

  // Automatically retry when there's an error
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`[useOrganizationUsersFetching] Retrying fetch (${retryCount + 1}/3)...`);
        fetchUsers();
      }, 1000 * retryCount); // Increasing delay between retries
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, fetchUsers]);

  // Automatically fetch users when organizationId changes
  useEffect(() => {
    if (organizationId) {
      console.log('[useOrganizationUsersFetching] Organization ID changed, fetching users for:', organizationId);
      fetchUsers();
    } else {
      // Clear users if no organization is selected
      console.log('[useOrganizationUsersFetching] No organization selected, clearing users');
      setUsers([]);
    }
  }, [organizationId, fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    setUsers // Export setUsers to allow direct updates if needed
  };
};
