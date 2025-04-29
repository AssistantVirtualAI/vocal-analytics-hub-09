
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { removeUserFromOrganization } from '@/services/organization/users/removeUser';

export const useUserRemoval = (
  selectedOrg: string | null, 
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);

  const removeUserFromOrg = useCallback(async (userId: string) => {
    if (!selectedOrg) {
      toast("Aucune organisation sélectionnée");
      return;
    }
    
    setLoading(true);
    try {
      await removeUserFromOrganization(userId, selectedOrg);
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error("Error removing user from organization:", error);
      // Toast is handled in the service
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, refreshUsers]);

  return {
    loading,
    removeUserFromOrg
  };
};
