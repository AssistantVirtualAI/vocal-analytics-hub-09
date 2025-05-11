import { useState, useCallback } from 'react';
import { OrganizationUser } from '@/types/organization';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define a type for the Supabase query response
type UserOrgQueryResult = {
  user_id: string;
  is_org_admin: boolean;
  organization_id: string;
  profiles: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

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
        // Cast data to the expected type structure
        const typedData = data as unknown as UserOrgQueryResult[];
        
        const formattedUsers: OrganizationUser[] = typedData.map(item => {
          // Create default user with minimal info
          const defaultUser: OrganizationUser = {
            id: item.user_id,
            email: '',
            displayName: '',
            avatarUrl: '',
            role: item.is_org_admin ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            isPending: false,
            isOrgAdmin: !!item.is_org_admin,
            isSuperAdmin: false
          };
          
          // Return default user if profiles is null or invalid
          if (!item.profiles) {
            return defaultUser;
          }
          
          // Otherwise, use profile data with nullish coalescing for safety
          return {
            ...defaultUser,
            email: item.profiles.email ?? '',
            displayName: item.profiles.display_name ?? '',
            avatarUrl: item.profiles.avatar_url ?? '',
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
