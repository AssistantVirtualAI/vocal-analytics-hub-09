
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cancelInvitation as cancelInvitationService } from '@/services/organization/users/invitations/cancelInvitation';
import { resendInvitation as resendInvitationService } from '@/services/organization/users/invitations/resendInvitation';

export const useInvitationManagement = (
  organizationId: string | null, 
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  
  const cancelInvitation = async (invitationId: string) => {
    if (!organizationId || loading) return;
    
    setLoading(true);
    try {
      await cancelInvitationService(invitationId);
      if (refreshUsers) {
        await refreshUsers();
      }
      toast.success("Invitation annulée avec succès");
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast.error("Erreur lors de l'annulation de l'invitation: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const resendInvitation = async (email: string) => {
    // Don't proceed if already sending an invitation or if this email is already being processed
    if (!organizationId || loading || resendingFor === email) {
      console.log(`Cannot resend invitation: organizationId=${organizationId}, loading=${loading}, already resending for ${resendingFor}`);
      return;
    }
    
    console.log(`Starting resend invitation process for ${email} in org ${organizationId}`);
    setResendingFor(email);
    const toastId = toast.loading("Envoi de l'invitation en cours...");
    
    try {
      console.log(`Calling resendInvitationService for ${email} in org ${organizationId}`);
      const result = await resendInvitationService(email, organizationId);
      
      toast.dismiss(toastId);
      toast.success("Invitation envoyée avec succès");
      console.log('Invitation resent successfully:', result);
      
      // Always refresh the user list after successful operation
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.dismiss(toastId);
      toast.error("Erreur lors de l'envoi: " + (error.message || "Une erreur est survenue"));
    } finally {
      console.log(`Finished resend invitation process for ${email}`);
      setResendingFor(null);
    }
  };

  return {
    loading,
    resendingFor,
    cancelInvitation,
    resendInvitation
  };
};
