
import { useState, useCallback } from 'react';
import { resetUserPassword } from '@/services/organization/users/passwordReset';
import { toast } from 'sonner';

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);

  const resetPassword = useCallback(async (email: string) => {
    if (loading) return;
    
    setLoading(true);
    const toastId = toast.loading("Envoi de l'email de réinitialisation en cours...");
    
    try {
      await resetUserPassword(email);
      toast.dismiss(toastId);
      toast.success(`Un email de réinitialisation a été envoyé à ${email}`);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.dismiss(toastId);
      toast.error(`Erreur: ${error.message || "Problème lors de l'envoi de l'email de réinitialisation"}`);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return {
    loading,
    resetPassword
  };
};
