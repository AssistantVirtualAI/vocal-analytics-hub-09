
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { resetUserPassword } from '@/services/organization/users/passwordReset';

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      await resetUserPassword(email);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Erreur lors de la réinitialisation du mot de passe: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    resetPassword
  };
};
