
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

  const fetchUsers = useCallback(async () => {
    if (!organizationId) {
      console.log('No organization ID provided, skipping user fetch');
      setUsers([]);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Fetching users for organization: ${organizationId}`);
      const fetchedUsers = await fetchOrganizationUsers(organizationId);
      console.log(`Fetched ${fetchedUsers.length} users:`, fetchedUsers);
      
      if (fetchedUsers.length === 0) {
        console.log('No users found for organization');
        setUsers([]);
        setLoading(false);
        return;
      }
      
      // Enhance users with admin status
      const enhancedUsers = await Promise.all(
        fetchedUsers.map(async (user) => {
          try {
            const isOrgAdmin = await checkOrganizationAdminStatus(user.id, organizationId);
            const isSuperAdmin = await checkSuperAdminStatus(user.id);
            return {
              ...user,
              isOrgAdmin,
              isSuperAdmin
            };
          } catch (error) {
            console.error(`Error checking admin status for user ${user.id}:`, error);
            return {
              ...user,
              isOrgAdmin: false,
              isSuperAdmin: false
            };
          }
        })
      );
      
      setUsers(enhancedUsers);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      toast.error("Erreur lors de la récupération des utilisateurs: " + error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Automatically fetch users when organizationId changes
  useEffect(() => {
    if (organizationId) {
      console.log('Organization ID changed, fetching users for:', organizationId);
      fetchUsers();
    } else {
      // Clear users if no organization is selected
      console.log('No organization selected, clearing users');
      setUsers([]);
    }
  }, [organizationId, fetchUsers]);

  return {
    users,
    loading,
    fetchUsers,
    setUsers // Export setUsers to allow direct updates if needed
  };
};
