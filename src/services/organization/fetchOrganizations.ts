
import { Organization } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';

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
