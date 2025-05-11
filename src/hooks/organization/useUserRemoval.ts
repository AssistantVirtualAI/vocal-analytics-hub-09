
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useUserRemoval = () => {
  const [loading, setLoading] = useState(false);

  const removeUser = useCallback(async (userId: string, orgId: string): Promise<void> => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    removeUser
  };
};
