
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Cancel an invitation
export const cancelInvitation = async (invitationId: string): Promise<void> => {
  try {
    console.log(`Canceling invitation ${invitationId}`);
    
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }

    toast.success("Invitation annulée avec succès.");
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error);
    toast.error("Erreur lors de l'annulation de l'invitation: " + error.message);
    throw error;
  }
};
