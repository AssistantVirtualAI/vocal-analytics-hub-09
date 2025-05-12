
import { supabase } from '@/integrations/supabase/client';

// Check if a user is an organization admin
export const checkUserIsOrgAdmin = async (userId: string, organizationId: string): Promise<boolean> => {
  try {
    console.log(`[adminChecks] Checking organization admin status for user ${userId} in org ${organizationId}`);
    
    const { data, error } = await supabase
      .from('user_organizations')
      .select('is_org_admin')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (error) {
      console.error('[adminChecks] Error checking org admin status:', error);
      return false;
    }
    
    return !!data?.is_org_admin;
  } catch (error) {
    console.error('[adminChecks] Error in checkUserIsOrgAdmin:', error);
    return false;
  }
};

// Check if a user is a super admin
export const checkUserIsSuperAdmin = async (userId: string): Promise<boolean> => {
  try {
    console.log(`[adminChecks] Checking super admin status for user ${userId}`);
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (error) {
      console.error('[adminChecks] Error checking super admin status:', error);
      return false;
    }
    
    const isSuperAdmin = !!data;
    console.log(`[adminChecks] Super admin check result for ${userId}: ${isSuperAdmin}`);
    return isSuperAdmin;
  } catch (error) {
    console.error('[adminChecks] Error in checkUserIsSuperAdmin:', error);
    return false;
  }
};
