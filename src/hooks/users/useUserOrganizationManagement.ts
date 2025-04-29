
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { addUserToOrganization } from '@/services/organization/users/addUser';

export const useUserOrganizationManagement = (
  organizationId: string | null,
  onUserAdded?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);

  const addUserToOrg = useCallback(async (email: string) => {
    if (!organizationId || !email) return;
    
    setLoading(true);
    try {
      await addUserToOrganization(email, organizationId);
      if (onUserAdded) {
        await onUserAdded();
      }
    } catch (error: any) {
      console.error('Error adding user to organization:', error);
      // Don't toast here, the function already does it
    } finally {
      setLoading(false);
    }
  }, [organizationId, onUserAdded]);

  return {
    loading,
    addUserToOrg
  };
};
