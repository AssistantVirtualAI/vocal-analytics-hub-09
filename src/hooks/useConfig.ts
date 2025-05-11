
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useConfig() {
  const { user } = useAuth();
  const [agentId, setAgentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        setError(null);
        
        // First, try to get organization data if user is logged in
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (userError) {
            console.error("Error fetching user organization:", userError);
          }
          
          if (userData?.organization_id) {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('agent_id')
              .eq('id', userData.organization_id)
              .maybeSingle();
            
            if (orgError) {
              console.error("Error fetching organization:", orgError);
            }
            
            if (orgData?.agent_id) {
              setAgentId(orgData.agent_id);
              return;
            }
          }
        }
        
        // Fallback to default configuration
        const defaultAgentId = "2df8e9d7-0939-4bd8-9da1-c99ac86eb2f8"; // Using the database UUID
        setAgentId(defaultAgentId);
      } catch (err) {
        console.error("Error in useConfig:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    
    fetchConfig();
  }, [user]);

  return { agentId, loading, error };
}
