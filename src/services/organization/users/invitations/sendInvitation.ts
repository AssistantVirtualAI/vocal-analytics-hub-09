
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
      
      // Refresh existing invitation
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

    // Show toast while sending invitation
    const toastId = toast.loading("Envoi de l'invitation en cours...");

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
        toast.dismiss(toastId);
        toast.error("Erreur lors de l'envoi: " + functionError.message);
        throw functionError;
      }

      if (functionResult && functionResult.error) {
        console.error('Error in supabase invitation:', functionResult.error);
        toast.dismiss(toastId);
        toast.error("Erreur: " + (typeof functionResult.error === 'string' ? functionResult.error : JSON.stringify(functionResult.error)));
        throw new Error(functionResult.error);
      }
      
      // Success! Update the toast
      toast.dismiss(toastId);
      toast.success("Invitation envoyée avec succès");
    } catch (error) {
      // Make sure we dismiss the loading toast if there's an error
      toast.dismiss(toastId);
      throw error;
    }
  } catch (error: any) {
    handleInvitationError(error, "de l'envoi de l'invitation");
    throw error;
  }
};
