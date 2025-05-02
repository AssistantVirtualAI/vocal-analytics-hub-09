
import { Organization } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchOrganizations = async (isAdmin: boolean, userId?: string): Promise<Organization[]> => {
  try {
    console.log(`Fetching organizations for user ${userId} (isAdmin: ${isAdmin})`);
    
    let query = supabase.from('organizations').select('*');
    
    // If not an admin, fetch only the organizations the user is a member of
    if (!isAdmin && userId) {
      console.log('Non-admin user - fetching organizations via user_organizations join');
      const { data: userOrganizations, error: userOrgError } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', userId);
      
      if (userOrgError) {
        console.error("Error fetching user's organizations:", userOrgError);
        throw userOrgError;
      }
      
      if (userOrganizations && userOrganizations.length > 0) {
        const orgIds = userOrganizations.map(userOrg => userOrg.organization_id);
        console.log(`User belongs to ${orgIds.length} organizations:`, orgIds);
        query = query.in('id', orgIds);
      } else {
        console.log('User does not belong to any organizations');
        return [];
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching organizations:", error);
      toast.error(`Erreur lors de la récupération des organisations: ${error.message}`);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No organizations found");
      return [];
    }
    
    console.log(`Successfully fetched ${data.length} organizations`);
    
    // Transform the data to match our Organization type
    return data.map(org => ({
      id: org.id,
      name: org.name,
      agentId: org.agent_id,
      description: org.description,
      createdAt: org.created_at,
    }));
  } catch (error) {
    console.error("Error in fetchOrganizations:", error);
    toast.error(`Erreur lors de la récupération des organisations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    throw error;
  }
};
