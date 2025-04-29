
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { addUserToOrganization } from '@/services/organization/users/addUser';

export const useUserAddition = (
  selectedOrg: string | null, 
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);

  const addUserToOrg = useCallback(async (email: string) => {
    if (!selectedOrg) {
      toast("Aucune organisation sélectionnée");
      return;
    }
    
    setLoading(true);
    try {
      await addUserToOrganization(email, selectedOrg);
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error("Error adding user to organization:", error);
      // Toast is handled in the service
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, refreshUsers]);

  return {
    loading,
    addUserToOrg
  };
};
