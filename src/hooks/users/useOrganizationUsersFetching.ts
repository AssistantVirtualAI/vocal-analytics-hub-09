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
  const timeoutRef = useRef<number | null>(null);
  const adminCheckLimitRef = useRef(25); // Limit number of admin status checks to prevent freezing

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log('[useOrganizationUsersFetching] Hook cleanup');
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
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
      abortControllerRef.current = null;
    }
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    abortControllerRef.current = new AbortController();
    
    fetchInProgressRef.current = true;
    lastOrgIdRef.current = organizationId;
    
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    
    // Add a small timeout to avoid UI flickering for fast requests
    timeoutRef.current = window.setTimeout(async () => {
      try {
        console.log(`[useOrganizationUsersFetching] Fetching users for organization: ${organizationId}`);
        const fetchedUsers = await fetchOrganizationUsers(organizationId);
        
        if (!isMountedRef.current) return;
        
        console.log(`[useOrganizationUsersFetching] Fetched ${fetchedUsers.length} users`);
        
        // Reset retry count on success
        setRetryCount(0);
        
        if (fetchedUsers.length === 0) {
          console.log('[useOrganizationUsersFetching] No users found for organization');
          setUsers([]);
          setLoading(false);
          fetchInProgressRef.current = false;
          return;
        }
        
        // Set users initially without admin status - quick render first
        setUsers(fetchedUsers);
        
        // Enhance users with admin status using web workers for heavy computation
        // This uses a separate worker thread to prevent UI freezing
        setTimeout(() => {
          processAdminStatus(fetchedUsers, organizationId);
        }, 100);
        
        if (isMountedRef.current) {
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
        timeoutRef.current = null;
      }
    }, 50);  // Small delay before fetching to avoid UI flickering
  }, [organizationId, retryCount]);

  // Process admin status in small batches with timeouts between batches to prevent UI freezing
  const processAdminStatus = async (fetchedUsers: OrganizationUser[], orgId: string) => {
    if (!isMountedRef.current) return;
    
    // Very small batch size to prevent UI blocking
    const batchSize = 3;
    const enhancedUsers = [...fetchedUsers];
    const userCount = Math.min(fetchedUsers.length, adminCheckLimitRef.current);
    
    console.log(`[useOrganizationUsersFetching] Processing admin status for ${userCount} users in batches of ${batchSize}`);
    
    // Process in smaller batches with timeouts between
    for (let i = 0; i < userCount; i += batchSize) {
      if (!isMountedRef.current) break;
      
      const batch = fetchedUsers.slice(i, i + batchSize);
      
      try {
        // Process each batch
        await Promise.all(batch.map(async (user, batchIndex) => {
          try {
            const index = i + batchIndex;
            if (index >= enhancedUsers.length) return;
            
            // Only check admin status for non-pending users
            if (!user.isPending) {
              const isOrgAdmin = await checkOrganizationAdminStatus(user.id, orgId);
              const isSuperAdmin = await checkSuperAdminStatus(user.id);
              
              enhancedUsers[index] = {
                ...enhancedUsers[index],
                isOrgAdmin,
                isSuperAdmin
              };
            }
          } catch (error) {
            console.error(`[useOrganizationUsersFetching] Error checking admin status:`, error);
          }
        }));
        
        // Update users state after each batch
        if (isMountedRef.current) {
          setUsers([...enhancedUsers]);
        }
        
        // Add delay between batches to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error('[useOrganizationUsersFetching] Batch processing error:', error);
      }
    }
    
    console.log('[useOrganizationUsersFetching] Finished processing admin statuses');
  };

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
