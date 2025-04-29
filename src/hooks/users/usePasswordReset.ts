
import { useState, useCallback } from 'react';
import { resetUserPassword } from '@/services/organization/users/passwordReset';

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      await resetUserPassword(email);
    } catch (error) {
      console.error("Error resetting password:", error);
      // Toast is handled in the service
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    resetPassword
  };
};
