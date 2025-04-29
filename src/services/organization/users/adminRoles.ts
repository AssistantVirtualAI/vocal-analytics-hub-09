
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Set organization admin status for a user
export const setOrganizationAdminStatus = async (userId: string, organizationId: string, isAdmin: boolean): Promise<void> => {
  try {
    console.log(`Setting org admin status for user ${userId} in org ${organizationId} to ${isAdmin}`);
    
    const { error } = await supabase
      .from('user_organizations')
      .update({ is_org_admin: isAdmin })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    
    toast.success(isAdmin 
      ? "L'utilisateur est maintenant administrateur de l'organisation" 
      : "L'utilisateur n'est plus administrateur de l'organisation");

  } catch (error: any) {
    console.error('Error setting organization admin status:', error);
    toast.error(`Erreur: ${error.message}`);
    throw error;
  }
};

// Set super admin status for a user
export const setSuperAdminStatus = async (userId: string, isAdmin: boolean): Promise<void> => {
  try {
    console.log(`Setting super admin status for user ${userId} to ${isAdmin}`);
    
    if (isAdmin) {
      // Remove any existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (deleteError) throw deleteError;
      
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });
        
      if (error) throw error;
    } else {
      // Remove admin role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
        
      if (deleteError) throw deleteError;
      
      // Add user role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'user'
        });
        
      if (error) throw error;
    }
    
    toast.success(isAdmin 
      ? "L'utilisateur est maintenant super administrateur" 
      : "L'utilisateur n'est plus super administrateur");
      
  } catch (error: any) {
    console.error('Error setting super admin status:', error);
    toast.error(`Erreur: ${error.message}`);
    throw error;
  }
};

// Check if a user is an organization admin
export const checkOrganizationAdminStatus = async (userId: string, organizationId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('is_org_admin')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();
      
    if (error) throw error;
    
    return data?.is_org_admin || false;
  } catch (error) {
    console.error('Error checking organization admin status:', error);
    return false;
  }
};

// Check if a user is a super admin
export const checkSuperAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
      
    if (error) throw error;
    
    return !!data;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};
