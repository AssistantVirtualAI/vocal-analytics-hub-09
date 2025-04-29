
import { useState, useCallback, useEffect } from 'react';
import { OrganizationUser } from '@/types/organization';
import { toast } from 'sonner';
import { fetchOrganizationUsers } from '@/services/organization/users/fetchUsers';

export const useOrganizationUsersFetching = (organizationId: string | null) => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      console.log(`Fetching users for organization: ${organizationId}`);
      const fetchedUsers = await fetchOrganizationUsers(organizationId);
      console.log(`Fetched ${fetchedUsers.length} users:`, fetchedUsers);
      setUsers(fetchedUsers);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Automatically fetch users when organizationId changes
  useEffect(() => {
    if (organizationId) {
      fetchUsers();
    }
  }, [organizationId, fetchUsers]);

  return {
    users,
    loading,
    fetchUsers,
  };
};
