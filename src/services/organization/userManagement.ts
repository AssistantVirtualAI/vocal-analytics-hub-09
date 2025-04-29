
import { OrganizationUser } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Fetch users for a specific organization
export const fetchOrganizationUsers = async (organizationId: string): Promise<OrganizationUser[]> => {
  try {
    console.log(`Fetching users for organization: ${organizationId}`);
    
    // First, get profiles of users in the organization using a direct join
    const { data: userOrgData, error: userOrgError } = await supabase
      .from('user_organizations')
      .select(`
        user_id,
        organization_id,
        profiles:user_id(
          id,
          email,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('organization_id', organizationId);

    if (userOrgError) {
      console.error('Error fetching user_organizations:', userOrgError);
      throw userOrgError;
    }

    // Get the user roles to determine admin status
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw rolesError;
    }

    // Then, get pending invitations
    const { data: invitationsData, error: invitationsError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      throw invitationsError;
    }

    // Format active users
    const activeUsers: OrganizationUser[] = [];
    
    if (userOrgData) {
      for (const item of userOrgData) {
        if (item.profiles) {
          const profile = item.profiles;
          const userRoles = rolesData?.filter(r => r.user_id === profile.id) || [];
          const role = userRoles.length > 0 ? userRoles[0].role : 'user';
          
          activeUsers.push({
            id: profile.id,
            email: profile.email || '',
            displayName: profile.display_name || '',
            avatarUrl: profile.avatar_url || '',
            role: role as 'admin' | 'user',
            createdAt: profile.created_at || new Date().toISOString(),
            isPending: false
          });
        }
      }
    }

    // Format pending invitations
    const pendingUsers: OrganizationUser[] = (invitationsData || []).map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      displayName: invitation.email.split('@')[0] || '',
      avatarUrl: '',
      role: 'user',
      createdAt: invitation.created_at,
      isPending: true
    }));

    console.log(`Found ${activeUsers.length} active users and ${pendingUsers.length} pending invitations`);
    
    // Combine active users and pending invitations
    return [...activeUsers, ...pendingUsers];
  } catch (error) {
    console.error('Error in fetchOrganizationUsers:', error);
    throw error;
  }
};

// Add a user to an organization
export const addUserToOrganization = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Adding user ${email} to organization ${organizationId}`);
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      console.error('Error checking if user exists:', userError);
      throw userError;
    }

    if (userData) {
      // User exists, check if already in organization
      const { data: existingUser, error: existingUserError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .single();

      if (existingUserError && existingUserError.code !== 'PGRST116') {
        console.error('Error checking existing user organization:', existingUserError);
        throw existingUserError;
      }

      if (existingUser) {
        toast("L'utilisateur est déjà membre de cette organisation.");
        return;
      }

      // Add user to organization
      const { error: addError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userData.id,
          organization_id: organizationId
        });

      if (addError) {
        console.error('Error adding user to organization:', addError);
        throw addError;
      }

      toast("Utilisateur ajouté à l'organisation avec succès.");
    } else {
      // User doesn't exist, create invitation
      const { error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          email,
          organization_id: organizationId,
          status: 'pending'
        });

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        throw inviteError;
      }

      toast("Invitation envoyée à l'utilisateur.");
    }
  } catch (error: any) {
    console.error('Error in addUserToOrganization:', error);
    toast("Erreur lors de l'ajout de l'utilisateur: " + error.message);
    throw error;
  }
};

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

// Cancel an invitation
export const cancelInvitation = async (invitationId: string): Promise<void> => {
  try {
    console.log(`Cancelling invitation ${invitationId}`);
    
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }

    toast("L'invitation a été annulée avec succès.");
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error);
    toast("Erreur lors de l'annulation de l'invitation: " + error.message);
    throw error;
  }
};

// Resend invitation
export const resendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Resending invitation to ${email} for organization ${organizationId}`);
    
    // For now, this is a placeholder that will be replaced with actual email sending logic
    // We're just showing a toast message to confirm the action was triggered
    toast(`Invitation renvoyée à ${email}`);
    
    // In a real implementation, you would call an API endpoint or edge function to send the email
    // For example:
    // await supabase.functions.invoke('resend-invitation', { body: { email, organizationId } });
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    toast("Erreur lors du renvoi de l'invitation: " + error.message);
    throw error;
  }
};

// Reset user password
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    console.log(`Resetting password for user ${email}`);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth?reset=true',
    });

    if (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }

    toast(`Un email de réinitialisation de mot de passe a été envoyé à ${email}`);
  } catch (error: any) {
    console.error('Error in resetUserPassword:', error);
    toast("Erreur lors de la réinitialisation du mot de passe: " + error.message);
    throw error;
  }
};
