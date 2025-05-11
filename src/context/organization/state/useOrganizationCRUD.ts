
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Organization } from '@/types/organization';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationCRUD = (
  session: any, 
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>, 
  setCurrentOrganization: React.Dispatch<React.SetStateAction<Organization | null>>,
  organizations: Organization[]
) => {
  const navigate = useNavigate();
  
  // Create a new organization
  const createOrganization = useCallback(async (name: string, description?: string, agentId?: string): Promise<string> => {
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      // Create organization with provided fields
      const newOrgData: Omit<Organization, "id" | "createdAt"> = {
        name,
        description,
        agentId,
        slug: name.toLowerCase().replace(/\s+/g, '-')
      };
      
      // Use direct Supabase call instead of createOrg
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: newOrgData.name,
          description: newOrgData.description,
          agent_id: newOrgData.agentId,
          slug: newOrgData.slug
        }])
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert operation');

      const newOrgId = data.id;

      // Refresh organizations list
      // Pass false as the first argument to indicate not admin by default
      // and user ID as second argument if available
      const orgs = await fetchOrganizations(false, session.user.id);
      setOrganizations(orgs);
      
      // Select the newly created organization
      const newOrg = orgs.find(org => org.id === newOrgId);
      if (newOrg) {
        setCurrentOrganization(newOrg);
        localStorage.setItem('current_organization_id', newOrgId);
      }
      
      toast({
        title: "Success", 
        description: "Organization created successfully"
      });
      
      return newOrgId;
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive"
      });
      throw error;
    }
  }, [session, setOrganizations, setCurrentOrganization]);

  // Update an organization
  const updateOrganization = useCallback(async (organization: Organization): Promise<void> => {
    try {
      // Use direct Supabase call instead of updateOrg
      const { error } = await supabase
        .from('organizations')
        .update({
          name: organization.name,
          description: organization.description,
          agent_id: organization.agentId,
          slug: organization.slug
        })
        .eq('id', organization.id);

      if (error) throw error;
      
      // Update local state
      setOrganizations(orgs => 
        orgs.map(org => org.id === organization.id ? organization : org)
      );
      
      setCurrentOrganization(current => 
        current?.id === organization.id ? organization : current
      );
      
      toast({
        title: "Success", 
        description: "Organization updated successfully"
      });
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error", 
        description: "Failed to update organization",
        variant: "destructive"
      });
      throw error;
    }
  }, [setOrganizations, setCurrentOrganization]);

  // Delete an organization
  const deleteOrganization = useCallback(async (organizationId: string): Promise<void> => {
    try {
      // Use direct Supabase call instead of deleteOrg
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;
      
      // Update local state
      setOrganizations(orgs => orgs.filter(org => org.id !== organizationId));
      
      // If deleted org was current, select another
      setCurrentOrganization(current => {
        if (current?.id === organizationId) {
          const remainingOrgs = organizations.filter(org => org.id !== organizationId);
          if (remainingOrgs.length > 0) {
            localStorage.setItem('current_organization_id', remainingOrgs[0].id);
            return remainingOrgs[0];
          } else {
            localStorage.removeItem('current_organization_id');
            return null;
          }
        }
        return current;
      });
      
      toast({
        title: "Success", 
        description: "Organization deleted successfully"
      });
      
      // Redirect to main dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error", 
        description: "Failed to delete organization",
        variant: "destructive"
      });
      throw error;
    }
  }, [organizations, setOrganizations, setCurrentOrganization, navigate]);
  
  return {
    createOrganization,
    updateOrganization,
    deleteOrganization
  };
};

// This ensures compatibility with the existing import structure in other files
import { fetchOrganizations } from '@/services/organization';
