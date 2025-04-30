
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
  const [localResending, setLocalResending] = useState(false);
  
  const handleResendInvitation = async () => {
    if (!email) {
      toast.error("Adresse email non disponible");
      return;
    }
    
    console.log("Resending invitation for:", email);
    setLocalResending(true);
    
    try {
      await onResendInvitation(email);
      console.log("Invitation resend initiated for:", email);
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast.error("Erreur lors du renvoi de l'invitation: " + (error?.message || "Veuillez réessayer"));
      setLocalResending(false);
    }
    
    // We'll rely on the parent component to reset the resending state when completed
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
        disabled={actionLoading || isResendingFor || cancelLoading || localResending}
      >
        {(isResendingFor || localResending) ? (
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-1" />
        )}
        {(isResendingFor || localResending) ? "Envoi en cours..." : "Renvoyer"}
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleCancelInvitation}
        disabled={actionLoading || isResendingFor || cancelLoading || localResending}
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
