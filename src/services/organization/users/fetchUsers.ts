
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
      .select('user_id')
      .eq('organization_id', organizationId);

    if (userOrgError) {
      console.error('[fetchOrganizationUsers] Error fetching user_organizations:', userOrgError);
      throw userOrgError;
    }

    const userIds = userOrgData?.map(item => item.user_id) || [];
    console.log(`[fetchOrganizationUsers] Found ${userIds.length} users in organization:`, userIds);
    
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

    if (!profilesData || profilesData.length === 0) {
      console.log('[fetchOrganizationUsers] No profile data found for user IDs');
      // Check if the current user's profile exists even if it's not included in the organization
      if (currentUser && userIds.includes(currentUser.id)) {
        console.log('[fetchOrganizationUsers] Current user is in organization but profile data is missing');
      }
      // Return pending invitations since no active users were found
      return await fetchPendingInvitations(organizationId);
    }

    console.log(`[fetchOrganizationUsers] Fetched ${profilesData.length} user profiles`);

    // Get the user roles to determine admin status
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .in('user_id', userIds);

    if (rolesError) {
      console.error('[fetchOrganizationUsers] Error fetching user roles:', rolesError);
      throw rolesError;
    }

    console.log(`[fetchOrganizationUsers] Fetched ${rolesData?.length || 0} user roles`);

    // Format active users
    const activeUsers: OrganizationUser[] = [];
    
    if (profilesData) {
      for (const profile of profilesData) {
        const userRoles = rolesData?.filter(r => r.user_id === profile.id) || [];
        const role = userRoles.length > 0 ? userRoles[0].role : 'user';
        
        // Get the organization admin status from user_organizations table
        const { data: orgAdminData } = await supabase
          .from('user_organizations')
          .select('is_org_admin')
          .eq('user_id', profile.id)
          .eq('organization_id', organizationId)
          .single();
        
        // Check if user is a super admin (has admin role in user_roles)
        const isSuperAdmin = role === 'admin';
        
        activeUsers.push({
          id: profile.id,
          email: profile.email || '',
          displayName: profile.display_name || profile.email?.split('@')[0] || '',
          avatarUrl: profile.avatar_url || '',
          role: role as 'admin' | 'user',
          createdAt: profile.created_at || new Date().toISOString(),
          isPending: false,
          isOrgAdmin: orgAdminData?.is_org_admin || false,
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
