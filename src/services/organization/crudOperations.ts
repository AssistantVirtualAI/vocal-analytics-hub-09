
import { Organization } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';

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
