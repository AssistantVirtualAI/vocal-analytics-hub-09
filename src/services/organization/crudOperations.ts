
import { Organization } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';

export const createOrganization = async (
  organization: Omit<Organization, 'id' | 'createdAt'>, 
  isAdmin: boolean,
  userId?: string
): Promise<string> => {
  try {
    // Generate a slug if not provided
    const slug = organization.slug || organization.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Insert the organization
    const { data, error } = await supabase
      .from('organizations')
      .insert([
        {
          name: organization.name,
          agent_id: organization.agentId,
          description: organization.description,
          slug: slug
        }
      ])
      .select('id')
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from insert operation');

    // If userId is provided, add the user to the organization
    if (userId) {
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert([
          {
            user_id: userId,
            organization_id: data.id,
            is_org_admin: true // Make the creator an org admin by default
          }
        ]);

      if (userOrgError) {
        console.error('Error adding user to organization:', userOrgError);
        // Consider what to do if this fails - maybe delete the org?
      }
    }

    return data.id;
  } catch (error: any) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

export const updateOrganization = async (organization: Organization): Promise<void> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .update({
        name: organization.name,
        agent_id: organization.agentId,
        description: organization.description,
        slug: organization.slug
      })
      .eq('id', organization.id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

export const deleteOrganization = async (organizationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    throw error;
  }
};
