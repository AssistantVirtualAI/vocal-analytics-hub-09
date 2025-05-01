
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleInvitationError } from './utils/errorHandler';

// Send an invitation to join an organization using Supabase's native invitation system
export const sendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Sending invitation to ${email} for organization ${organizationId}`);

    // Check if the invitation already exists
    const { data: existingInvitation, error: checkError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing invitation:', checkError);
      throw checkError;
    }

    // If invitation exists, update it. Otherwise, create a new one
    if (existingInvitation) {
      console.log('Invitation already exists, refreshing it');
      
      // First step: Change status to something else temporarily
      const { error: tempUpdateError } = await supabase
        .from('organization_invitations')
        .update({
          status: 'refreshing' // Temporary status to trigger a change
        })
        .eq('id', existingInvitation.id);

      if (tempUpdateError) {
        console.error('Error in temporary status update:', tempUpdateError);
        throw tempUpdateError;
      }

      // Second step: Change status back to pending to trigger the DB function
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({
          status: 'pending'  // This will trigger the database function to update token and expiration
        })
        .eq('id', existingInvitation.id);

      if (updateError) {
        console.error('Error refreshing invitation:', updateError);
        throw updateError;
      }
    } else {
      // Create new invitation entry in our custom table
      const { error: insertError } = await supabase
        .from('organization_invitations')
        .insert({
          email,
          organization_id: organizationId,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error creating invitation record:', insertError);
        throw insertError;
      }
    }

    console.log('About to send invitation email using edge function');

    try {
      // Send invitation email using edge function
      const { data: functionResult, error: functionError } = await supabase
        .functions.invoke('send-supabase-invitation', {
          body: { 
            email,
            organizationId
          }
        });

      if (functionError) {
        console.error('Error sending invitation via edge function:', functionError);
        throw functionError;
      }

      if (functionResult && functionResult.error) {
        console.error('Error in supabase invitation:', functionResult.error);
        throw new Error(typeof functionResult.error === 'string' ? functionResult.error : JSON.stringify(functionResult.error));
      }
      
      toast.success('Invitation envoyée avec succès');
      console.log('Invitation sent successfully:', functionResult);
    } catch (error) {
      // Make sure we capture the error
      console.error('Error in send-supabase-invitation call:', error);
      throw error;
    }
  } catch (error: any) {
    handleInvitationError(error, "de l'envoi de l'invitation");
    throw error;
  }
};
