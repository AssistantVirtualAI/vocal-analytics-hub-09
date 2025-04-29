
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Remove a user from an organization
export const removeUserFromOrganization = async (userId: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Removing user ${userId} from organization ${organizationId}`);
    
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error removing user from organization:', error);
      throw error;
    }

    toast("L'utilisateur a été retiré de l'organisation avec succès.");
  } catch (error: any) {
    console.error('Error in removeUserFromOrganization:', error);
    toast("Erreur lors du retrait de l'utilisateur: " + error.message);
    throw error;
  }
};
