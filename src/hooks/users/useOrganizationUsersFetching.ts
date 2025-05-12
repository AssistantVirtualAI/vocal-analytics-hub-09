
import { useState, useCallback, useEffect, useRef } from 'react';
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
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const lastOrgIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!organizationId) {
      console.log('[useOrganizationUsersFetching] No organization ID provided, skipping user fetch');
      setUsers([]);
      setLoading(false);
      return;
    }
    
    // Skip if already fetching for this org
    if (fetchInProgressRef.current && lastOrgIdRef.current === organizationId) {
      console.log(`[useOrganizationUsersFetching] Already fetching users for org ${organizationId}, skipping duplicate fetch`);
      return;
    }
    
    // Cancel previous fetch if there was one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    fetchInProgressRef.current = true;
    lastOrgIdRef.current = organizationId;
    
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    
    try {
      console.log(`[useOrganizationUsersFetching] Fetching users for organization: ${organizationId}`);
      const fetchedUsers = await fetchOrganizationUsers(organizationId);
      
      if (!isMountedRef.current) return;
      
      console.log(`[useOrganizationUsersFetching] Fetched ${fetchedUsers.length} users:`, fetchedUsers);
      
      // Reset retry count on success
      setRetryCount(0);
      
      if (fetchedUsers.length === 0) {
        console.log('[useOrganizationUsersFetching] No users found for organization');
        setUsers([]);
        setLoading(false);
        fetchInProgressRef.current = false;
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
      
      if (isMountedRef.current) {
        setUsers(enhancedUsers);
        setError(null);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[useOrganizationUsersFetching] Fetch was aborted');
        return;
      }
      
      console.error('[useOrganizationUsersFetching] Error fetching organization users:', error);
      
      if (isMountedRef.current) {
        setError(error);
        
        // Only show toast after multiple failures to avoid spamming
        if (retryCount > 1) {
          toast.error("Erreur lors de la récupération des utilisateurs: " + error.message);
        }
        
        // Increment retry count
        setRetryCount(prev => prev + 1);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, [organizationId, retryCount]);

  // Automatically fetch users when organizationId changes
  useEffect(() => {
    if (organizationId && organizationId !== lastOrgIdRef.current) {
      console.log('[useOrganizationUsersFetching] Organization ID changed, fetching users for:', organizationId);
      fetchUsers();
    } else if (!organizationId) {
      // Clear users if no organization is selected
      console.log('[useOrganizationUsersFetching] No organization selected, clearing users');
      setUsers([]);
      lastOrgIdRef.current = null;
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
