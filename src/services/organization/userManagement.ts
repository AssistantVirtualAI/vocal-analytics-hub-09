
import { OrganizationUser } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchOrganizationUsers = async (organizationId: string): Promise<OrganizationUser[]> => {
  try {
    // Step 1: Get user IDs for this organization
    const { data: orgUserLinks, error: orgUserError } = await supabase
      .from('user_organizations')
      .select('user_id, organization_id')
      .eq('organization_id', organizationId);

    if (orgUserError) throw orgUserError;

    // Extract user IDs
    const userIds = orgUserLinks?.map(link => link.user_id) || [];

    // Step 2: Fetch user profiles for these IDs if there are any users
    const { data: profiles, error: profilesError } = userIds.length > 0 
      ? await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    // Step 3: Fetch user roles
    const { data: rolesData, error: rolesError } = userIds.length > 0
      ? await supabase
          .from('user_roles')
          .select('*')
          .in('user_id', userIds)
      : { data: [], error: null };

    if (rolesError) throw rolesError;

    // Step 4: Fetch pending invitations
    const { data: invitationsData, error: invitationsError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    if (invitationsError) throw invitationsError;

    // Map profiles to users with roles
    const formattedUsers: OrganizationUser[] = (profiles || []).map(profile => {
      const userRoles = rolesData?.filter(r => r.user_id === profile.id) || [];
      const role = userRoles.length > 0 ? userRoles[0].role : 'user';
      
      return {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name || profile.email?.split('@')[0] || '',
        avatarUrl: profile.avatar_url || '',
        role: role as 'admin' | 'user',
        createdAt: profile.created_at,
        isPending: false
      };
    });

    // Add pending invitations
    const pendingUsers: OrganizationUser[] = (invitationsData || []).map(invite => ({
      id: invite.id,
      email: invite.email,
      displayName: invite.email.split('@')[0] || '',
      avatarUrl: '',
      role: 'user' as const,
      createdAt: invite.created_at,
      isPending: true
    }));

    return [...formattedUsers, ...pendingUsers];
  } catch (error: any) {
    console.error('Error fetching organization users:', error);
    throw error;
  }
};

export const addUserToOrganization = async (email: string, organizationId: string): Promise<void> => {
  // First, check if user exists
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (userError) throw userError;
  
  if (!userData) {
    // User doesn't exist, create an invitation entry
    const { error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        email: email,
        organization_id: organizationId,
        status: 'pending'
      });

    if (inviteError) {
      // Check if it's a duplicate invitation error
      if (inviteError.code === '23505') { // PostgreSQL unique constraint violation
        toast(`Une invitation pour ${email} est déjà en attente.`);
        return;
      }
      throw inviteError;
    }

    toast(`Invitation envoyée à ${email}. Ils seront ajoutés à l'organisation après inscription.`);
    return;
  }

  // Check if user already in organization
  const { data: existingLink, error: linkCheckError } = await supabase
    .from('user_organizations')
    .select('*')
    .eq('user_id', userData.id)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (linkCheckError) throw linkCheckError;
  
  if (existingLink) {
    toast(`L'utilisateur est déjà membre de cette organisation.`);
    return;
  }

  // Add user to organization
  const { error: addError } = await supabase
    .from('user_organizations')
    .insert({
      user_id: userData.id,
      organization_id: organizationId
    });

  if (addError) throw addError;

  toast(`${email} a été ajouté à l'organisation avec succès.`);
};

export const removeUserFromOrganization = async (userId: string, organizationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;
    
    toast("L'utilisateur a été retiré de l'organisation avec succès.");
  } catch (error: any) {
    console.error('Error removing user from organization:', error);
    toast(`Erreur lors du retrait de l'utilisateur: ${error.message}`);
    throw error;
  }
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;
    
    toast("L'invitation a été annulée avec succès.");
  } catch (error: any) {
    console.error('Error canceling invitation:', error);
    toast(`Erreur lors de l'annulation de l'invitation: ${error.message}`);
    throw error;
  }
};

// Nouvelle fonction pour renvoyer une invitation
export const resendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    // Vérifier si l'invitation existe
    const { data: invitation, error: checkError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (!invitation) {
      toast(`Aucune invitation en attente trouvée pour ${email}.`);
      return;
    }
    
    // Supprime l'ancienne invitation
    const { error: deleteError } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitation.id);
      
    if (deleteError) throw deleteError;
    
    // Crée une nouvelle invitation
    const { error: createError } = await supabase
      .from('organization_invitations')
      .insert({
        email: email,
        organization_id: organizationId,
        status: 'pending'
      });
      
    if (createError) throw createError;
    
    toast(`Invitation renvoyée à ${email} avec succès.`);
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    toast(`Erreur lors du renvoi de l'invitation: ${error.message}`);
    throw error;
  }
};

// Nouvelle fonction pour réinitialiser le mot de passe d'un utilisateur
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    
    if (error) throw error;
    
    toast(`Email de réinitialisation du mot de passe envoyé à ${email}.`);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    toast(`Erreur lors de la réinitialisation du mot de passe: ${error.message}`);
    throw error;
  }
};
