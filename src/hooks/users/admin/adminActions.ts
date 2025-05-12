
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Toggle organization admin status
export const toggleOrganizationAdminStatus = async (
  targetUserId: string, 
  organizationId: string, 
  makeAdmin: boolean
): Promise<void> => {
  try {
    console.log(`[adminActions] Toggling org admin status for user ${targetUserId} to ${makeAdmin}`);
    
    const { error } = await supabase
      .from('user_organizations')
      .update({ is_org_admin: makeAdmin })
      .eq('user_id', targetUserId)
      .eq('organization_id', organizationId);
    
    if (error) throw error;
    
    toast.success(`L'utilisateur est maintenant ${makeAdmin ? 'administrateur' : 'utilisateur'} de l'organisation`);
  } catch (error: any) {
    console.error('[adminActions] Error toggling organization admin status:', error);
    toast.error(`Erreur: ${error.message}`);
    throw error;
  }
};

// Toggle super admin status
export const toggleSuperAdminStatus = async (
  targetUserId: string, 
  makeAdmin: boolean
): Promise<void> => {
  try {
    console.log(`[adminActions] Toggling super admin status for user ${targetUserId} to ${makeAdmin}`);
    
    // First delete existing role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId);
    
    if (deleteError) throw deleteError;
    
    // Then insert new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUserId,
        role: makeAdmin ? 'admin' : 'user'
      });
    
    if (insertError) throw insertError;
    
    toast.success(`L'utilisateur est maintenant ${makeAdmin ? 'super admin' : 'utilisateur standard'}`);
  } catch (error: any) {
    console.error('[adminActions] Error toggling super admin status:', error);
    toast.error(`Erreur: ${error.message}`);
    throw error;
  }
};
