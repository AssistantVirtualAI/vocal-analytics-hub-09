
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches organization details by ID
 */
export const getOrganizationName = async (organizationId: string): Promise<string> => {
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .maybeSingle();

  if (orgError) {
    console.error('Error retrieving organization name:', orgError);
    // Don't throw here, we can continue with default name
  }

  return organization?.name || "Votre organisation";
};
