
import { useState, useCallback } from 'react';
import { OrganizationUser } from '@/types/organization';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationUsersLoading = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Load organization users
  const loadOrganizationUsers = useCallback(async (orgId: string) => {
    try {
      if (!orgId) return;
      
      setLoading(true);
      console.log(`Fetching users for organization: ${orgId}`);
      
      // Fetch organization users directly from Supabase
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          is_org_admin,
          organization_id,
          profiles:user_id(id, email, display_name, avatar_url)
        `)
        .eq('organization_id', orgId);
      
      if (error) throw error;
      
      if (data) {
        const formattedUsers: OrganizationUser[] = data.map(item => {
          // Handle case where profiles might be null or not an expected object
          if (!item.profiles) {
            return {
              id: item.user_id,
              email: '',
              displayName: '',
              avatarUrl: '',
              role: item.is_org_admin ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              isPending: false,
              isOrgAdmin: !!item.is_org_admin
            };
          }
          
          // Handle case where profiles might not be the right type or has an error
          if (typeof item.profiles !== 'object' || 'error' in item.profiles) {
            return {
              id: item.user_id,
              email: '',
              displayName: '',
              avatarUrl: '',
              role: item.is_org_admin ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              isPending: false,
              isOrgAdmin: !!item.is_org_admin
            };
          }
          
          // Now TypeScript knows profiles is a valid object, but we still use optional chaining for safety
          const profile = item.profiles as {
            id?: string; 
            email?: string; 
            display_name?: string | null; 
            avatar_url?: string | null;
          };
          
          return {
            id: item.user_id,
            email: profile?.email || '',
            displayName: profile?.display_name || '',
            avatarUrl: profile?.avatar_url || '',
            role: item.is_org_admin ? 'admin' : 'user',
            createdAt: new Date().toISOString(), // fallback
            isPending: false,
            isOrgAdmin: !!item.is_org_admin
          };
        });
        
        console.log('Formatted users:', formattedUsers);
        setUsers(formattedUsers);
      }
      
    } catch (error) {
      console.error(`Error loading users for organization ${orgId}:`, error);
      toast({
        title: "Error", 
        description: "Failed to load organization users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    setUsers,
    loading,
    loadOrganizationUsers
  };
};
