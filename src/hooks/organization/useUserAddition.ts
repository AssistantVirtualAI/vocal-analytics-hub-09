
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useUserAddition = () => {
  const [loading, setLoading] = useState(false);

  const addUser = useCallback(async (email: string, orgId: string, role?: string): Promise<void> => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    addUser
  };
};
