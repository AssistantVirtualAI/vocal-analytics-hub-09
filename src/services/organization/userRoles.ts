
import { supabase } from '@/integrations/supabase/client';

export const setUserRole = async (userId: string, role: 'admin' | 'user'): Promise<void> => {
  // Check if role already exists
  const { data: existingRole, error: roleCheckError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (roleCheckError) throw roleCheckError;
  
  if (existingRole) {
    // Role already set
    return;
  }

  // Remove existing roles
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  // Add new role
  const { error: addError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: role
    });

  if (addError) throw addError;
};
