
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
    
    // If already resending for this email, prevent duplicate requests
    if (resendLoading === email) {
      console.log("Already resending for this email, ignoring duplicate request");
      return;
    }
    
    setResendLoading(email);
    
    // Clear any previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout to handle potential Edge function timeouts
    timeoutRef.current = setTimeout(() => {
      if (resendLoading === email) {
        setResendLoading(null);
        toast.error("L'opération a pris trop de temps. Veuillez réessayer.");
      }
    }, 15000); // 15 seconds timeout
    
    try {
      await resendInvitation(email, selectedOrg);
      console.log("Invitation resent successfully, refreshing users...");
      
      // Clear timeout since operation completed successfully
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (refreshUsers) {
        await refreshUsers();
      }
      
      toast.success("Invitation renvoyée avec succès");
      setResendLoading(null);
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      
      // Clear timeout since operation completed with error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Don't show duplicate toasts if error handler already showed one
      if (!error?.handledByErrorHandler) {
        toast.error(`Erreur: ${error?.message || "Échec de l'envoi d'invitation"}`);
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
