
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Reset user password
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    console.log(`Attempting to reset password for user ${email}`);
    
    // Construct a properly formatted redirect URL
    const baseUrl = window.location.origin;
    const redirectTo = `${baseUrl}/auth?reset=true`;
    
    console.log(`Using redirect URL: ${redirectTo}`);
    
    const { error, data } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
    
    console.log('Password reset email sent successfully:', data);

    toast(`Un email de réinitialisation de mot de passe a été envoyé à ${email}`);
  } catch (error: any) {
    console.error('Error in resetUserPassword:', error);
    toast("Erreur lors de la réinitialisation du mot de passe: " + error.message);
    throw error;
  }
};
