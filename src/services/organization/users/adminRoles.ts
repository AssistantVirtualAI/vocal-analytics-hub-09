
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Check if a user is an organization admin
export const checkOrganizationAdminStatus = async (userId: string, organizationId: string): Promise<boolean> => {
  try {
    console.log(`Checking organization admin status for user ${userId} in org ${organizationId}`);
    
    // First verify we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error getting auth session:', sessionError);
      return false;
    }
    
    if (!session) {
      console.log('No active session, cannot check permissions');
      return false;
    }
    
    const { data, error } = await supabase
      .from('user_organizations')
      .select('is_org_admin')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking organization admin status:', error);
      return false;
    }
    
    console.log('Org admin check result:', data);
    return data?.is_org_admin || false;
  } catch (error) {
    console.error('Error checking organization admin status:', error);
    return false;
  }
};

// Check if a user is a super admin
export const checkSuperAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Checking super admin status for user ${userId}`);
    
    // First verify we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error getting auth session:', sessionError);
      return false;
    }
    
    if (!session) {
      console.log('No active session, cannot check permissions');
      return false;
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
      
    if (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
    
    const isSuperAdmin = !!data;
    console.log('Super admin check result:', isSuperAdmin);
    return isSuperAdmin;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

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
      // First check if the user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      // If user has a role, update it, otherwise insert it
      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', userId);
          
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });
          
        if (error) throw error;
      }
    } else {
      // Update admin role to user
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', userId)
        .eq('role', 'admin');
        
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
