
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Send an invitation to join an organization
export const sendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Sending invitation to ${email} for organization ${organizationId}`);

    // Check if invitation already exists
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
      // Create new invitation
      const { error: insertError } = await supabase
        .from('organization_invitations')
        .insert({
          email,
          organization_id: organizationId,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error creating invitation:', insertError);
        throw insertError;
      }
    }

    // Retrieve the token for the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('token')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single();

    if (invitationError) {
      console.error('Error retrieving invitation token:', invitationError);
      throw invitationError;
    }

    // Get organization name for better email customization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error retrieving organization name:', orgError);
      // Don't throw here, we can continue with default name
    }

    const organizationName = organization?.name || "Votre organisation";
    const invitationUrl = `${window.location.origin}/auth?invitation=${invitation.token}`;

    // Attempt to send invitation email
    try {
      console.log('Sending invitation email with params:', {
        email, 
        organizationName, 
        invitationUrl
      });
      
      const { data, error: edgeFunctionError } = await supabase
        .functions.invoke('send-invitation-email', {
          body: {
            email,
            organizationName,
            invitationUrl
          }
        });

      if (edgeFunctionError) {
        console.error('Error invoking edge function:', edgeFunctionError);
        // Don't throw, we'll still create the invitation even if email fails
      } else {
        console.log('Email function response:', data);
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't throw, we'll still create the invitation even if email fails
    }

    toast.success("Invitation envoyée avec succès.");
  } catch (error: any) {
    console.error('Error in sendInvitation:', error);
    toast.error("Erreur lors de l'envoi de l'invitation: " + error.message);
    throw error;
  }
};

// Resend an invitation
export const resendInvitation = async (email: string, organizationId: string): Promise<void> => {
  try {
    console.log(`Resending invitation to ${email} for organization ${organizationId}`);
    
    // Update the invitation to refresh the token and expiration
    // Use maybeSingle() instead of single() to avoid errors when multiple or no rows are found
    const { data: invitations, error: queryError } = await supabase
      .from('organization_invitations')
      .select('id, token')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    if (queryError) {
      console.error('Error querying invitation:', queryError);
      throw queryError;
    }

    if (!invitations || invitations.length === 0) {
      throw new Error('Aucune invitation en attente trouvée');
    }

    // Update the invitation (first one if multiple found)
    const invitationId = invitations[0].id;

    const { data: updatedInvitation, error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'pending'  // This will trigger the database function to update token and expiration
      })
      .eq('id', invitationId)
      .select('token')
      .single();

    if (updateError) {
      console.error('Error refreshing invitation:', updateError);
      throw updateError;
    }

    // Get organization name for better email customization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error retrieving organization name:', orgError);
      // Don't throw here, we can continue with default name
    }

    const organizationName = organization?.name || "Votre organisation";
    const invitationUrl = `${window.location.origin}/auth?invitation=${updatedInvitation.token}`;

    // Attempt to send invitation email
    try {
      console.log('Resending invitation email with params:', {
        email, 
        organizationName, 
        invitationUrl
      });
      
      const { data, error: edgeFunctionError } = await supabase
        .functions.invoke('send-invitation-email', {
          body: {
            email,
            organizationName,
            invitationUrl
          }
        });

      if (edgeFunctionError) {
        console.error('Error invoking edge function:', edgeFunctionError);
        // Don't throw, we'll still refresh the invitation even if email fails
      } else {
        console.log('Email function response:', data);
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't throw, we'll still refresh the invitation even if email fails
    }
    
    toast.success("Invitation renvoyée avec succès.");
  } catch (error: any) {
    console.error('Error in resendInvitation:', error);
    toast.error("Erreur lors du renvoi de l'invitation: " + error.message);
    throw error;
  }
};

// Cancel an invitation
export const cancelInvitation = async (invitationId: string): Promise<void> => {
  try {
    console.log(`Canceling invitation ${invitationId}`);
    
    const { error } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }

    toast.success("Invitation annulée avec succès.");
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error);
    toast.error("Erreur lors de l'annulation de l'invitation: " + error.message);
    throw error;
  }
};

// Accept an invitation
export const acceptInvitation = async (token: string, userId: string): Promise<void> => {
  try {
    console.log(`Accepting invitation with token ${token} for user ${userId}`);
    
    // Find the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('id, organization_id, email, expires_at')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (invitationError) {
      console.error('Error finding invitation:', invitationError);
      throw invitationError;
    }

    if (!invitation) {
      throw new Error("Invitation non trouvée ou déjà utilisée.");
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      throw new Error("Cette invitation a expiré.");
    }

    // Add user to organization
    const { error: userOrgError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: invitation.organization_id
      });

    if (userOrgError) {
      console.error('Error adding user to organization:', userOrgError);
      throw userOrgError;
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error marking invitation as accepted:', updateError);
      throw updateError;
    }

    toast.success("Vous avez rejoint l'organisation avec succès.");
  } catch (error: any) {
    console.error('Error in acceptInvitation:', error);
    toast.error("Erreur lors de l'acceptation de l'invitation: " + error.message);
    throw error;
  }
};
