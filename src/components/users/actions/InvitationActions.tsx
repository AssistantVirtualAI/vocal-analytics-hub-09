
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [localLoading, setLocalLoading] = useState(false);
  
  const handleResendInvitation = async () => {
    if (actionLoading || localLoading) return;
    
    setLocalLoading(true);
    console.log(`Resending invitation to ${email}`);
    
    try {
      await onResendInvitation(email);
      console.log('Invitation resent successfully');
    } catch (error) {
      console.error('Error resending invitation:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (actionLoading || localLoading) return;
    
    setLocalLoading(true);
    try {
      await onCancelInvitation(invitationId);
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Combined loading state
  const isLoading = actionLoading || localLoading || isResendingFor;

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleResendInvitation}
        disabled={isLoading}
        className="flex items-center"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Mail className="h-4 w-4 mr-1" />
        )}
        Renvoyer
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleCancelInvitation}
        disabled={isLoading}
        className="flex items-center text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <X className="h-4 w-4 mr-1" />
        Annuler
      </Button>
    </div>
  );
};
