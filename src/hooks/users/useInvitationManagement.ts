
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { cancelInvitation, resendInvitation } from '@/services/organization/users/invitations';

export const useInvitationManagement = (
  selectedOrg: string | null,
  refreshUsers?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending timeouts when unmounting
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cancelUserInvitation = useCallback(async (invitationId: string) => {
    setCancelLoading(true);
    try {
      await cancelInvitation(invitationId);
      toast.success("Invitation annulée avec succès");
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      // Toast is handled in the service
    } finally {
      setCancelLoading(false);
    }
  }, [refreshUsers]);

  const resendUserInvitation = useCallback(async (email: string) => {
    if (!selectedOrg) {
      toast.error("Aucune organisation sélectionnée");
      return;
    }
    
    console.log(`useInvitationManagement: Resending invitation to ${email} for org ${selectedOrg}`);
    setResendLoading(email);
    
    // Set a timeout to handle potential Edge function timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (resendLoading === email) {
        setResendLoading(null);
        toast.error("L'opération a pris trop de temps. Veuillez réessayer.");
      }
    }, 20000); // 20 seconds timeout
    
    try {
      await resendInvitation(email, selectedOrg);
      console.log("Invitation resent successfully, refreshing users...");
      if (refreshUsers) {
        await refreshUsers();
      }
      toast.success("Invitation renvoyée avec succès");
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast.error(`Erreur: ${error?.message || "Échec de l'envoi d'invitation"}`);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setResendLoading(null);
    }
  }, [selectedOrg, refreshUsers, resendLoading]);

  return {
    loading: loading || cancelLoading || !!resendLoading,
    cancelLoading,
    resendLoading,
    isResendingFor: resendLoading,
    cancelInvitation: cancelUserInvitation,
    resendInvitation: resendUserInvitation
  };
};
