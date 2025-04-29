
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Refreshes an invitation token by updating its status
 */
export const refreshInvitationToken = async (invitationId: string): Promise<string> => {
  console.log(`Refreshing invitation token for ID: ${invitationId}`);

  // First step: set status to something else temporarily
  const { error: tempUpdateError } = await supabase
    .from('organization_invitations')
    .update({ status: 'refreshing' })
    .eq('id', invitationId);

  if (tempUpdateError) {
    console.error('Error in temporary status update:', tempUpdateError);
    throw new Error(`Erreur lors du rafraîchissement de l'invitation: ${tempUpdateError.message}`);
  }
  
  // Second step: set status back to pending to trigger token refresh
  const { data: updatedInvitation, error: updateError } = await supabase
    .from('organization_invitations')
    .update({ status: 'pending' })
    .eq('id', invitationId)
    .select('token')
    .maybeSingle();

  if (updateError) {
    console.error('Error refreshing invitation:', updateError);
    throw new Error(`Erreur lors du rafraîchissement de l'invitation: ${updateError.message}`);
  }

  console.log('Updated invitation response:', updatedInvitation);

  // If token is still missing, fetch it directly
  if (!updatedInvitation || !updatedInvitation.token) {
    const { data: fetchedInvitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('token')
      .eq('id', invitationId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching updated invitation:', fetchError);
      throw new Error(`Erreur lors de la récupération de l'invitation: ${fetchError.message}`);
    }

    if (!fetchedInvitation?.token) {
      throw new Error("Token d'invitation non généré");
    }
    
    console.log(`Invitation fetched, token: ${fetchedInvitation.token}`);
    return fetchedInvitation.token;
  }
  
  return updatedInvitation.token;
};

/**
 * Finds a pending invitation by email and organization ID
 */
export const findPendingInvitation = async (email: string, organizationId: string): Promise<{id: string, token?: string}> => {
  console.log(`Looking for pending invitation for email ${email} in org ${organizationId}`);
  
  const { data: invitations, error: queryError } = await supabase
    .from('organization_invitations')
    .select('id, token')
    .eq('email', email)
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  if (queryError) {
    console.error('Error querying invitation:', queryError);
    throw new Error(`Erreur lors de la recherche de l'invitation: ${queryError.message}`);
  }

  if (!invitations || invitations.length === 0) {
    throw new Error('Aucune invitation en attente trouvée');
  }

  // Return the first invitation found
  return {
    id: invitations[0].id,
    token: invitations[0].token
  };
};
