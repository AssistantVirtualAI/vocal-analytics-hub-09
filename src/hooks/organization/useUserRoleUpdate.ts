
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useUserRoleUpdate = () => {
  const [loading, setLoading] = useState(false);

  const updateUserRole = useCallback(async (userId: string, role: string, orgId: string): Promise<void> => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    updateUserRole
  };
};
