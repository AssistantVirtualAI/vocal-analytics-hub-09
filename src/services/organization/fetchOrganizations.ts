
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/types/organization';

export const fetchOrganizations = async (isAdmin: boolean, userId?: string): Promise<Organization[]> => {
  try {
    console.log(`Fetching organizations for user ${userId} (isAdmin: ${isAdmin})`);
    
    // Safety check for user ID when not admin
    if (!isAdmin && !userId) {
      console.warn("Non-admin request without user ID, returning empty array");
      return [];
    }
    
    // If we're not explicitly told this is an admin user, check super admin status
    if (!isAdmin && userId) {
      try {
        // Get the current user's session to verify auth
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session check error:", sessionError);
          throw sessionError;
        }
        
        if (!sessionData?.session) {
          console.warn("No active session found");
          return [];
        }
        
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
      } catch (err) {
        console.error("Error during admin role check:", err);
        // Don't fail the entire function, just continue without admin privileges
      }
    }
    
    // For admin users, fetch all organizations
    if (isAdmin) {
      console.log('Fetching all organizations for admin user');
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*');
        
        if (error) {
          console.error("Error fetching all organizations:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log("No organizations found for admin user");
          return [];
        }
        
        console.log(`Successfully fetched ${data.length} organizations for admin:`, data);
        
        return data.map(mapToOrganization);
      } catch (err) {
        console.error("Error in admin fetch block:", err);
        throw err;
      }
    }
    
    // For non-admin users, fetch only the organizations they belong to
    if (userId) {
      console.log('Non-admin user - fetching organizations via user_organizations join');
      try {
        const { data: userOrganizations, error: userOrgError } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', userId);
        
        if (userOrgError) {
          console.error("Error fetching user's organizations:", userOrgError);
          throw userOrgError;
        }
        
        if (!userOrganizations || userOrganizations.length === 0) {
          console.log('User does not belong to any organizations');
          return [];
        }
        
        const orgIds = userOrganizations.map(userOrg => userOrg.organization_id);
        console.log(`User belongs to ${orgIds.length} organizations:`, orgIds);
        
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .in('id', orgIds);
        
        if (error) {
          console.error("Error fetching organizations by IDs:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log("No organizations found with the given IDs");
          return [];
        }
        
        console.log(`Successfully fetched ${data.length} organizations for user:`, data);
        
        return data.map(mapToOrganization);
      } catch (err) {
        console.error("Error in non-admin fetch block:", err);
        throw err;
      }
    }
    
    console.log("No user ID provided and not admin, returning empty array");
    return [];
    
  } catch (error) {
    console.error("Error in fetchOrganizations:", error);
    throw error;
  }
};

// Helper function to map database organization to Organization type
const mapToOrganization = (org: any): Organization => {
  return {
    id: org.id,
    name: org.name,
    agentId: org.agent_id,
    description: org.description || "",  // Convert null to empty string for better consistency
    createdAt: org.created_at,
    // Generate slug from name if not present in the database
    slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  };
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
  if (!userId) {
    console.error("fetchUserOrganizations called without userId");
    return [];
  }
  return fetchOrganizations(false, userId);
}
