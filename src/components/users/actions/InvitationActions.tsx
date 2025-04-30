
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
  
  const handleResendInvitation = async () => {
    if (!email) {
      toast.error("Adresse email non disponible");
      return;
    }
    
    console.log("Resending invitation for:", email);
    try {
      await onResendInvitation(email);
      console.log("Invitation resent successfully for:", email);
    } catch (error: any) {
      console.error("Error resending invitation:", error);
    }
  };
  
  const handleCancelInvitation = async () => {
    setCancelLoading(true);
    try {
      await onCancelInvitation(invitationId);
    } catch (error: any) {
      console.error("Error canceling invitation:", error);
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
        Renvoyer
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
