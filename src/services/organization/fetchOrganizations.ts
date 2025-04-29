
import { Organization } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';

export const fetchOrganizations = async (isAdmin: boolean, userId?: string): Promise<Organization[]> => {
  try {
    // With the RLS policies in place, we can simply query all organizations
    // The RLS will filter out organizations the user doesn't have access to
    const { data, error } = await supabase
      .from('organizations')
      .select('*');
    
    if (error) {
      console.error("Error fetching organizations:", error);
      throw error;
    }
    
    if (!data) return [];
    
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
    throw error;
  }
};
