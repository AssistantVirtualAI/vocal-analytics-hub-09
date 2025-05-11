
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationPermissions = () => {
  const [userHasAdminAccessToCurrentOrg, setUserHasAdminAccessToCurrentOrg] = useState(false);

  // Check if user has admin access to the current organization
  const checkUserAccess = useCallback(async (userId: string, orgId: string) => {
    try {
      // Check if user is a super admin
      const { data: adminData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (adminData) {
        setUserHasAdminAccessToCurrentOrg(true);
        return true;
      }
      
      // Check if user is an admin of this organization
      const { data } = await supabase
        .from('user_organizations')
        .select('is_org_admin')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .maybeSingle();
      
      const hasOrgAdmin = !!data?.is_org_admin;
      setUserHasAdminAccessToCurrentOrg(hasOrgAdmin);
      return hasOrgAdmin;
    } catch (error) {
      console.error("Error checking user access:", error);
      setUserHasAdminAccessToCurrentOrg(false);
      return false;
    }
  }, []);

  return {
    userHasAdminAccessToCurrentOrg,
    checkUserAccess
  };
};
