
import { useState, useCallback } from 'react';
import { OrganizationUser } from '@/types/organization';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOrganizationUsers = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);

  // Load organization users
  const loadOrganizationUsers = useCallback(async (orgId: string) => {
    try {
      if (!orgId) return;
      
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
          // First check if profiles is actually an error object
          const isProfilesError = typeof item.profiles === 'object' && 
                                  item.profiles !== null && 
                                  'error' in item.profiles;
                                  
          // If it's an error or null/undefined, use empty values
          if (isProfilesError || item.profiles === null || item.profiles === undefined) {
            return {
              id: item.user_id,
              email: '',
              displayName: '',
              avatarUrl: '',
              role: item.is_org_admin ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              isPending: false
            };
          }
          
          // Type guard to ensure profiles is the expected object type
          type ProfileData = { id: string; email: string; display_name: string | null; avatar_url: string | null };
          
          // Use a type assertion with a type guard to safely handle the profiles data
          // First cast to unknown then to ProfileData to avoid direct type assertion errors
          const profile = (item.profiles as unknown) as ProfileData;
          
          return {
            id: item.user_id,
            email: profile.email || '',
            displayName: profile.display_name || '',
            avatarUrl: profile.avatar_url || '',
            role: item.is_org_admin ? 'admin' : 'user',
            createdAt: new Date().toISOString(), // fallback
            isPending: false
          };
        });
        
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error(`Error loading users for organization ${orgId}:`, error);
      toast({
        title: "Error", 
        description: "Failed to load organization users",
        variant: "destructive"
      });
    }
  }, []);

  // Add a user to organization
  const addUser = useCallback(async (email: string, orgId: string, role?: string): Promise<void> => {
    try {
      if (!orgId) {
        throw new Error("No organization selected");
      }
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (userError) throw userError;
      
      if (!userData) {
        throw new Error(`User with email ${email} not found`);
      }
      
      // Check if user is already in the organization
      const { data: existingMember, error: memberError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userData.id)
        .eq('organization_id', orgId)
        .maybeSingle();
        
      if (memberError) throw memberError;
      
      if (existingMember) {
        throw new Error('User is already a member of this organization');
      }
      
      // Add user to organization
      const { error: addError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userData.id,
          organization_id: orgId,
          is_org_admin: role === 'admin'
        });
        
      if (addError) throw addError;
      
      await loadOrganizationUsers(orgId);
      
      toast({
        title: "Success", 
        description: "User added successfully"
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadOrganizationUsers]);

  // Remove a user from organization
  const removeUser = useCallback(async (userId: string, orgId: string): Promise<void> => {
    try {
      if (!orgId) {
        throw new Error("No organization selected");
      }
      
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', orgId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users => users.filter(user => user.id !== userId));
      
      toast({
        title: "Success", 
        description: "User removed successfully"
      });
    } catch (error) {
      console.error("Error removing user:", error);
      toast({
        title: "Error", 
        description: "Failed to remove user",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  // Update a user's role
  const updateUser = useCallback(async (userId: string, role: string, orgId: string): Promise<void> => {
    try {
      if (!orgId) {
        throw new Error("No organization selected");
      }
      
      const isAdmin = role === 'admin';
      
      // Update user role
      const { error } = await supabase
        .from('user_organizations')
        .update({ is_org_admin: isAdmin })
        .eq('organization_id', orgId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users => users.map(user => 
        user.id === userId ? { ...user, role: role as 'admin' | 'user' } : user
      ));
      
      toast({
        title: "Success", 
        description: "User role updated successfully"
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error", 
        description: "Failed to update user role",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  return {
    users,
    loadOrganizationUsers,
    addUser,
    removeUser,
    updateUser
  };
};
