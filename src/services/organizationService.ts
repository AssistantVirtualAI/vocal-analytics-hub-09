
import { Organization, OrganizationUser, OrganizationInvitation } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchOrganizations = async (isAdmin: boolean, userId?: string): Promise<Organization[]> => {
  let query = supabase.from('organizations').select('*');
  
  // If not admin, only fetch organizations the user has access to
  if (!isAdmin && userId) {
    query = supabase
      .from('organizations')
      .select('*')
      .in('id', (await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', userId)).data?.map(item => item.organization_id) || []);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Transform the data to match our Organization type
  return data.map(org => ({
    id: org.id,
    name: org.name,
    agentId: org.agent_id,
    description: org.description,
    createdAt: org.created_at,
  }));
};

export const createOrganization = async (
  organization: Omit<Organization, 'id' | 'createdAt'>,
  isAdmin: boolean,
  userId?: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: organization.name,
      agent_id: organization.agentId,
      description: organization.description
    })
    .select()
    .single();

  if (error) throw error;

  // If the user is not an admin, add them to the organization
  if (!isAdmin && userId) {
    const { error: linkError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: data.id
      });
      
    if (linkError) throw linkError;
  }
  
  return data.id;
};

export const updateOrganization = async (organization: Organization): Promise<void> => {
  const { error } = await supabase
    .from('organizations')
    .update({
      name: organization.name,
      agent_id: organization.agentId,
      description: organization.description
    })
    .eq('id', organization.id);

  if (error) throw error;
};

export const deleteOrganization = async (organizationId: string): Promise<void> => {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId);

  if (error) throw error;
};

export const fetchOrganizationUsers = async (organizationId: string): Promise<OrganizationUser[]> => {
  // Get user IDs for this organization
  const { data: orgUserLinks, error: orgUserError } = await supabase
    .from('user_organizations')
    .select('user_id, organization_id')
    .eq('organization_id', organizationId);

  if (orgUserError) throw orgUserError;

  // Extract user IDs
  const userIds = orgUserLinks?.map(link => link.user_id) || [];

  // Fetch user profiles for these IDs if there are any users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']); // Dummy ID to avoid empty IN clause

  if (profilesError) throw profilesError;

  // Fetch user roles
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']); // Dummy ID to avoid empty IN clause

  if (rolesError) throw rolesError;

  // Fetch pending invitations
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
    throw new Error(`L'utilisateur est déjà membre de cette organisation.`);
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
  const { error } = await supabase
    .from('user_organizations')
    .delete()
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (error) throw error;
};

export const setUserRole = async (userId: string, role: 'admin' | 'user'): Promise<void> => {
  // Check if role already exists
  const { data: existingRole, error: roleCheckError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (roleCheckError) throw roleCheckError;
  
  if (existingRole) {
    // Role already set
    return;
  }

  // Remove existing roles
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  // Add new role
  const { error: addError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: role
    });

  if (addError) throw addError;
};
