
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
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast.error("Erreur lors de l'annulation de l'invitation: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const resendInvitation = async (email: string) => {
    if (!organizationId || loading || resendingFor) return;
    
    setResendingFor(email);
    try {
      console.log(`Resending invitation to ${email} for org ${organizationId}`);
      await resendInvitationService(email, organizationId);
      
      // No need to refresh users after resending an invitation
      console.log('Invitation resent successfully');
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      // Note: Toast notifications are handled by the service
    } finally {
      // Set a small timeout to avoid UI flashing
      setTimeout(() => {
        setResendingFor(null);
      }, 500);
    }
  };

  return {
    loading,
    resendingFor,
    cancelInvitation,
    resendInvitation
  };
};
