
import { OrganizationUser } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Fetch users for a specific organization
export const fetchOrganizationUsers = async (organizationId: string): Promise<OrganizationUser[]> => {
  try {
    console.log(`[fetchOrganizationUsers] Starting fetch for organization: ${organizationId}`);
    
    // First, try to fetch the current authenticated user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('[fetchOrganizationUsers] Error getting current user:', userError);
      throw userError;
    } else {
      console.log('[fetchOrganizationUsers] Current user:', currentUser?.id);
    }

    // First, get user IDs in the organization
    const { data: userOrgData, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('user_id, is_org_admin')
      .eq('organization_id', organizationId);

    if (userOrgError) {
      console.error('[fetchOrganizationUsers] Error fetching user_organizations:', userOrgError);
      throw userOrgError;
    }

    const userIds = userOrgData?.map(item => item.user_id) || [];
    console.log(`[fetchOrganizationUsers] Found ${userIds.length} users in organization:`, userIds);
    
    // Create a map of user IDs to their org admin status
    const orgAdminMap = new Map();
    userOrgData?.forEach(item => {
      orgAdminMap.set(item.user_id, item.is_org_admin);
    });

    // If no users in the organization, just return pending invitations
    if (userIds.length === 0) {
      console.log('[fetchOrganizationUsers] No users found in organization, checking for pending invitations');
      const pendingUsers = await fetchPendingInvitations(organizationId);
      console.log(`[fetchOrganizationUsers] Found ${pendingUsers.length} pending invitations`);
      return pendingUsers;
    }

    // Get the user profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);
      
    if (profilesError) {
      console.error('[fetchOrganizationUsers] Error fetching user profiles:', profilesError);
      throw profilesError;
    }

    // Check if any profiles were found
    if (!profilesData || profilesData.length === 0) {
      console.log('[fetchOrganizationUsers] No profile data found for user IDs');
      // Return pending invitations since no active users were found
      return await fetchPendingInvitations(organizationId);
    }

    console.log(`[fetchOrganizationUsers] Fetched ${profilesData.length} user profiles`);

    // Get the user roles to determine super admin status
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('[fetchOrganizationUsers] Error fetching user roles:', rolesError);
      throw rolesError;
    }

    console.log(`[fetchOrganizationUsers] Fetched ${rolesData?.length || 0} user roles`);

    // Create a map of user IDs to their super admin status
    const superAdminMap = new Map();
    rolesData?.forEach(role => {
      if (role.role === 'admin') {
        superAdminMap.set(role.user_id, true);
      }
    });

    // Format active users
    const activeUsers: OrganizationUser[] = [];
    
    if (profilesData) {
      for (const profile of profilesData) {
        // Skip profiles that don't have an id (shouldn't happen, but just in case)
        if (!profile.id) continue;
        
        // Get admin statuses from our maps
        const isOrgAdmin = orgAdminMap.get(profile.id) || false;
        const isSuperAdmin = superAdminMap.get(profile.id) || false;
        
        activeUsers.push({
          id: profile.id,
          email: profile.email || '',
          displayName: profile.display_name || profile.email?.split('@')[0] || '',
          avatarUrl: profile.avatar_url || '',
          role: isSuperAdmin ? 'admin' : 'user',
          createdAt: profile.created_at || new Date().toISOString(),
          isPending: false,
          isOrgAdmin: isOrgAdmin || isSuperAdmin, // Super admins are also org admins
          isSuperAdmin: isSuperAdmin
        });
      }
    }

    // Get pending invitations
    const pendingUsers = await fetchPendingInvitations(organizationId);
    
    console.log(`[fetchOrganizationUsers] Result: ${activeUsers.length} active users and ${pendingUsers.length} pending invitations`);
    
    // Combine active users and pending invitations
    return [...activeUsers, ...pendingUsers];
  } catch (error: any) {
    console.error('[fetchOrganizationUsers] Error in fetchOrganizationUsers:', error);
    toast.error("Erreur lors de la récupération des utilisateurs: " + error.message);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
  }
};

// Helper function to fetch pending invitations
export const fetchPendingInvitations = async (organizationId: string): Promise<OrganizationUser[]> => {
  try {
    console.log(`[fetchPendingInvitations] Checking for pending invitations for org: ${organizationId}`);
    
    // Get pending invitations
    const { data: invitationsData, error: invitationsError } = await supabase
      .from('organization_invitations')
      .select('id, email, created_at, token, expires_at, status')
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    if (invitationsError) {
      console.error('[fetchPendingInvitations] Error fetching invitations:', invitationsError);
      throw invitationsError;
    }

    console.log(`[fetchPendingInvitations] Found ${invitationsData?.length || 0} pending invitations`);

    // Format pending invitations
    return (invitationsData || []).map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      displayName: invitation.email.split('@')[0] || '',
      avatarUrl: '',
      role: 'user',
      createdAt: invitation.created_at,
      isPending: true,
      isOrgAdmin: false, // Pending users are not org admins
      isSuperAdmin: false // Pending users are not super admins
    }));
  } catch (error) {
    console.error('[fetchPendingInvitations] Error fetching pending invitations:', error);
    return [];
  }
};
