
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserX, RefreshCw, KeyRound } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { OrganizationUser } from '@/types/organization';

interface UserActionsProps {
  user: OrganizationUser;
  currentUserId: string | undefined;
  actionLoading: boolean;
  onRemoveUser: (userId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onResendInvitation: (email: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

export const UserActions = ({
  user,
  currentUserId,
  actionLoading,
  onRemoveUser,
  onCancelInvitation,
  onResendInvitation,
  onResetPassword
}: UserActionsProps) => {
  const [localLoading, setLocalLoading] = useState(false);
  
  // Log for debugging whenever the component renders
  useEffect(() => {
    console.log("UserActions - Rendering for user:", user.email, "isPending:", user.isPending);
  }, [user]);
  
  const handleResendInvitation = async () => {
    setLocalLoading(true);
    try {
      await onResendInvitation(user.email);
      console.log("Invitation resent successfully for:", user.email);
    } catch (error) {
      console.error("Error resending invitation:", error);
    } finally {
      setLocalLoading(false);
    }
  };
  
  if (user.isPending) {
    return (
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResendInvitation}
          disabled={actionLoading || localLoading}
        >
          {(actionLoading || localLoading) ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Renvoyer
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onCancelInvitation(user.id)}
          disabled={actionLoading || localLoading}
        >
          <UserX className="h-4 w-4 mr-1" />
          Annuler
        </Button>
      </div>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={actionLoading || localLoading || user.id === currentUserId}>
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => onResetPassword(user.email)}
          disabled={actionLoading || localLoading}
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Réinitialiser mot de passe
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-destructive"
          onClick={() => onRemoveUser(user.id)}
          disabled={actionLoading || localLoading || user.id === currentUserId}
        >
          <UserX className="h-4 w-4 mr-2" />
          Retirer de l'organisation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
