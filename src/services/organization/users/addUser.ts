
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Add a user to an organization
export const addUserToOrganization = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Adding user ${email} to organization ${organizationId}`);
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      console.error('Error checking if user exists:', userError);
      throw userError;
    }

    if (userData) {
      // User exists, check if already in organization
      const { data: existingUser, error: existingUserError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .single();

      if (existingUserError && existingUserError.code !== 'PGRST116') {
        console.error('Error checking existing user organization:', existingUserError);
        throw existingUserError;
      }

      if (existingUser) {
        toast("L'utilisateur est déjà membre de cette organisation.");
        return;
      }

      // Add user to organization
      const { error: addError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userData.id,
          organization_id: organizationId
        });

      if (addError) {
        console.error('Error adding user to organization:', addError);
        throw addError;
      }

      toast("Utilisateur ajouté à l'organisation avec succès.");
    } else {
      // User doesn't exist, create invitation
      const { error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          email,
          organization_id: organizationId,
          status: 'pending'
        });

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        throw inviteError;
      }

      toast("Invitation envoyée à l'utilisateur.");
    }
  } catch (error: any) {
    console.error('Error in addUserToOrganization:', error);
    toast("Erreur lors de l'ajout de l'utilisateur: " + error.message);
    throw error;
  }
};
