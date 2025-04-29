
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Reset user password
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    console.log(`Resetting password for user ${email}`);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth?reset=true',
    });

    if (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }

    toast(`Un email de réinitialisation de mot de passe a été envoyé à ${email}`);
  } catch (error: any) {
    console.error('Error in resetUserPassword:', error);
    toast("Erreur lors de la réinitialisation du mot de passe: " + error.message);
    throw error;
  }
};
