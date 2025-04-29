
import { useState, useCallback } from 'react';
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
      const fetchedUsers = await fetchOrganizationUsers(organizationId);
      setUsers(fetchedUsers);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  return {
    users,
    loading,
    fetchUsers,
  };
};
