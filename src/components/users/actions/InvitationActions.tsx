
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationActionsProps {
  email: string;
  invitationId: string;
  isResendingFor: boolean;
  actionLoading: boolean;
  onResendInvitation: (email: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
}

export const InvitationActions = ({
  email,
  invitationId,
  isResendingFor,
  actionLoading,
  onResendInvitation,
  onCancelInvitation
}: InvitationActionsProps) => {
  const [cancelLoading, setCancelLoading] = useState(false);
  const [resendAttempted, setResendAttempted] = useState(false);
  
  const handleResendInvitation = async () => {
    if (!email) {
      toast.error("Adresse email non disponible");
      return;
    }
    
    console.log("Resending invitation for:", email);
    setResendAttempted(true);
    
    try {
      await onResendInvitation(email);
      console.log("Invitation resent successfully for:", email);
      // The toast is handled by the service, but let's add a fallback
      setTimeout(() => {
        if (isResendingFor) {
          toast.error("Délai d'envoi dépassé. Veuillez réessayer.");
        }
      }, 10000);
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast.error("Erreur lors du renvoi de l'invitation: " + (error?.message || "Veuillez réessayer"));
    } finally {
      // Don't reset resendAttempted here as we want to show the spinner until the parent resets isResendingFor
    }
  };
  
  const handleCancelInvitation = async () => {
    setCancelLoading(true);
    try {
      await onCancelInvitation(invitationId);
      toast.success("Invitation annulée avec succès");
    } catch (error: any) {
      console.error("Error canceling invitation:", error);
      toast.error("Erreur lors de l'annulation: " + (error?.message || "Veuillez réessayer"));
    } finally {
      setCancelLoading(false);
    }
  };
  
  return (
    <div className="flex justify-end gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleResendInvitation}
        disabled={actionLoading || isResendingFor || cancelLoading}
      >
        {isResendingFor ? (
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-1" />
        )}
        {isResendingFor ? "Envoi en cours..." : "Renvoyer"}
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleCancelInvitation}
        disabled={actionLoading || isResendingFor || cancelLoading}
      >
        {cancelLoading ? (
          <span className="h-4 w-4 mr-1 inline-block border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <UserX className="h-4 w-4 mr-1" />
        )}
        Annuler
      </Button>
    </div>
  );
};
