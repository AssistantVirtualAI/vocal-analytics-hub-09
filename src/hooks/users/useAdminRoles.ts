
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAdminRoles = (
  organizationId: string | null,
  userId: string | undefined,
  refreshUsers?: () => Promise<void>
) => {
  const [currentUserIsOrgAdmin, setCurrentUserIsOrgAdmin] = useState(false);
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const checkInProgressRef = useRef(false);
  const isMountedRef = useRef(true);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      checkInProgressRef.current = false;
    };
  }, []);

  const checkUserAccess = useCallback(async () => {
    if (!userId || !organizationId || checkInProgressRef.current) {
      return;
    }

    checkInProgressRef.current = true;
    setLoading(true);

    try {
      console.log(`[useAdminRoles] Checking permissions for user ${userId} in org ${organizationId}`);
      
      // Check if user is super admin
      const isSuperAdmin = await checkSuperAdminStatus(userId);
      
      // If user is super admin, they're automatically an org admin too
      if (isSuperAdmin && isMountedRef.current) {
        console.log(`[useAdminRoles] User ${userId} super admin status: ${isSuperAdmin}`);
        setCurrentUserIsSuperAdmin(true);
        setCurrentUserIsOrgAdmin(true);
        checkInProgressRef.current = false;
        return;
      }
      
      // Check if user is org admin
      const { data, error } = await supabase
        .from('user_organizations')
        .select('is_org_admin')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking org admin status:', error);
        throw error;
      }
      
      const isOrgAdmin = !!data?.is_org_admin;
      
      if (isMountedRef.current) {
        console.log(`[useAdminRoles] User ${userId} permissions - Super Admin: ${isSuperAdmin}, Org Admin: ${isOrgAdmin}`);
        setCurrentUserIsOrgAdmin(isOrgAdmin);
        setCurrentUserIsSuperAdmin(isSuperAdmin);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      if (isMountedRef.current) {
        setCurrentUserIsOrgAdmin(false);
        setCurrentUserIsSuperAdmin(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      checkInProgressRef.current = false;
    }
  }, [userId, organizationId]);

  // Check permissions whenever dependencies change
  useEffect(() => {
    if (userId && organizationId) {
      console.log('[useAdminRoles] Dependencies changed, checking permissions');
      checkUserAccess();
    }
  }, [userId, organizationId, checkUserAccess]);

  // Toggle organization admin status
  const toggleOrganizationAdmin = useCallback(async (targetUserId: string, makeAdmin: boolean) => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      console.log(`Toggling org admin status for user ${targetUserId} to ${makeAdmin}`);
      
      const { error } = await supabase
        .from('user_organizations')
        .update({ is_org_admin: makeAdmin })
        .eq('user_id', targetUserId)
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      
      if (refreshUsers) {
        await refreshUsers();
      }
      
      toast.success(`L'utilisateur est maintenant ${makeAdmin ? 'administrateur' : 'utilisateur'} de l'organisation`);
    } catch (error: any) {
      console.error('Error toggling organization admin status:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [organizationId, refreshUsers]);

  // Toggle super admin status
  const toggleSuperAdmin = useCallback(async (targetUserId: string, makeAdmin: boolean) => {
    setLoading(true);
    try {
      console.log(`Toggling super admin status for user ${targetUserId} to ${makeAdmin}`);
      
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
      
      if (refreshUsers) {
        await refreshUsers();
      }
      
      toast.success(`L'utilisateur est maintenant ${makeAdmin ? 'super admin' : 'utilisateur standard'}`);
    } catch (error: any) {
      console.error('Error toggling super admin status:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [refreshUsers]);

  return {
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin,
    loading,
    checkCurrentUserPermissions: checkUserAccess,
    toggleOrganizationAdmin,
    toggleSuperAdmin
  };
};

// Standalone function to check if a user is a super admin
export const checkSuperAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Checking super admin status for user ${userId}`);
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
    
    const isSuperAdmin = !!data;
    console.log(`Super admin check result: ${isSuperAdmin}`);
    return isSuperAdmin;
  } catch (error) {
    console.error('Error in checkSuperAdminStatus:', error);
    return false;
  }
};

// Standalone function to check if a user is an organization admin
export const checkOrganizationAdminStatus = async (userId: string, organizationId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('is_org_admin')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking org admin status:', error);
      return false;
    }
    
    return !!data?.is_org_admin;
  } catch (error) {
    console.error('Error in checkOrganizationAdminStatus:', error);
    return false;
  }
};
