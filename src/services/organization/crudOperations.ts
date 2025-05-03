
import { Organization } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Create a new organization
export const createOrganization = async (
  organization: Omit<Organization, 'id' | 'createdAt'>, 
  isAdmin: boolean, 
  userId?: string
): Promise<string> => {
  try {
    console.log(`Creating new organization: ${organization.name}`);
    
    // Ensure slug is valid
    if (!organization.slug) {
      organization.slug = organization.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
    
    // Insert into organizations table
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organization.name,
        agent_id: organization.agentId,
        description: organization.description,
        slug: organization.slug
      })
      .select('id')
      .single();
    
    if (orgError) {
      console.error("Error creating organization:", orgError);
      throw orgError;
    }
    
    const organizationId = orgData.id;
    console.log(`Organization created with ID: ${organizationId}`);

    // Only add user to organization if userId is provided
    if (userId) {
      console.log(`Adding user ${userId} to organization ${organizationId}`);
      
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          is_org_admin: true // Make the creator an admin of the organization
        });
      
      if (userOrgError) {
        console.error("Error adding user to organization:", userOrgError);
        throw userOrgError;
      }
    }
    
    return organizationId;
  } catch (error: any) {
    console.error("Error in createOrganization:", error);
    toast.error(`Erreur lors de la création de l'organisation: ${error.message}`);
    throw error;
  }
};

// Update an existing organization
export const updateOrganization = async (organization: Organization): Promise<void> => {
  try {
    console.log(`Updating organization: ${organization.id}`);
    
    // Ensure slug is valid
    if (!organization.slug) {
      organization.slug = organization.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
    
    const { error } = await supabase
      .from('organizations')
      .update({
        name: organization.name,
        agent_id: organization.agentId,
        description: organization.description,
        slug: organization.slug
      })
      .eq('id', organization.id);
    
    if (error) {
      console.error("Error updating organization:", error);
      toast.error(`Erreur lors de la mise à jour de l'organisation: ${error.message}`);
      throw error;
    }
    
    console.log("Organization updated successfully");
  } catch (error: any) {
    console.error("Error in updateOrganization:", error);
    toast.error(`Erreur lors de la mise à jour de l'organisation: ${error.message}`);
    throw error;
  }
};

// Delete an organization
export const deleteOrganization = async (organizationId: string): Promise<void> => {
  try {
    console.log(`Deleting organization: ${organizationId}`);
    
    // Delete all user_organizations entries first
    const { error: userOrgError } = await supabase
      .from('user_organizations')
      .delete()
      .eq('organization_id', organizationId);
    
    if (userOrgError) {
      console.error("Error deleting user organization mappings:", userOrgError);
    }
    
    // Delete the organization
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);
    
    if (error) {
      console.error("Error deleting organization:", error);
      toast.error(`Erreur lors de la suppression de l'organisation: ${error.message}`);
      throw error;
    }
    
    console.log("Organization deleted successfully");
  } catch (error: any) {
    console.error("Error in deleteOrganization:", error);
    toast.error(`Erreur lors de la suppression de l'organisation: ${error.message}`);
    throw error;
  }
};
