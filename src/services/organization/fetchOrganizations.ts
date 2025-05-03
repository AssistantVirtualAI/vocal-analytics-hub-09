
import { supabase } from '@/integrations/supabase/client';
import { Organization } from '@/types/organization';

/**
 * Fetch all organizations
 */
export async function fetchAllOrganizations(): Promise<Organization[]> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*');
    
    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Map the data to ensure it has the right shape
    return data.map((org: any): Organization => ({
      id: org.id,
      name: org.name,
      agentId: org.agent_id,
      description: org.description || undefined,
      createdAt: org.created_at,
      // Generate a slug from the name if not available
      slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error fetching all organizations:', error);
    throw error;
  }
}

/**
 * Fetch organizations for a specific user
 */
export async function fetchUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', userId);
    
    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Extract organization IDs
    const orgIds = data.map((item: any) => item.organization_id);
    
    // Fetch the actual organization data
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIds);
    
    if (orgsError) throw orgsError;

    if (!orgs || orgs.length === 0) {
      return [];
    }

    // Map the data to ensure it has the right shape
    return orgs.map((org: any): Organization => ({
      id: org.id,
      name: org.name,
      agentId: org.agent_id,
      description: org.description || undefined,
      createdAt: org.created_at,
      // Generate a slug from the name if not available
      slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    throw error;
  }
}
