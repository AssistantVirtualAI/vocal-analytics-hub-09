
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/types/organization';
import { toast } from 'sonner';

export const fetchOrganizations = async (isAdmin: boolean, userId?: string): Promise<Organization[]> => {
  try {
    console.log(`Fetching organizations for user ${userId} (isAdmin: ${isAdmin})`);
    
    // First check if the user is a super admin
    if (userId) {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');
        
      if (rolesError) {
        console.error("Error checking if user is admin:", rolesError);
      } else {
        // If user has admin role, override the isAdmin parameter
        const isSuperAdmin = userRoles && userRoles.length > 0;
        if (isSuperAdmin) {
          console.log('User is a super admin, fetching all organizations');
          isAdmin = true;
        }
      }
    }
    
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
        // Returning empty array immediately to avoid unnecessary query
        return [];
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching organizations:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No organizations found");
      return [];
    }
    
    console.log(`Successfully fetched ${data.length} organizations:`, data);
    
    // Transform the data to match our Organization type
    return data.map(org => {
      // Create a properly typed organization object
      const organization: Organization = {
        id: org.id,
        name: org.name,
        agentId: org.agent_id,
        description: org.description || undefined,
        createdAt: org.created_at,
        // Generate slug from name if not present in the database
        slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      };
      return organization;
    });
  } catch (error) {
    console.error("Error in fetchOrganizations:", error);
    toast.error(`Erreur lors de la récupération des organisations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    throw error;
  }
};

/**
 * Fetch all organizations
 */
export async function fetchAllOrganizations(): Promise<Organization[]> {
  return fetchOrganizations(true);
}

/**
 * Fetch organizations for a specific user
 */
export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  return fetchOrganizations(false, userId);
}
