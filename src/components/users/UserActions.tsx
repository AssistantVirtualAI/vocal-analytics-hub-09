
import { useState } from 'react';
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
  // Log for debugging
  console.log("UserActions - Processing user:", user.email, "isPending:", user.isPending);
  
  if (user.isPending) {
    return (
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onResendInvitation(user.email)}
          disabled={actionLoading}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Renvoyer
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onCancelInvitation(user.id)}
          disabled={actionLoading}
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
        <Button variant="outline" size="sm" disabled={actionLoading || user.id === currentUserId}>
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => onResetPassword(user.email)}
          disabled={actionLoading}
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Réinitialiser mot de passe
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-destructive"
          onClick={() => onRemoveUser(user.id)}
          disabled={actionLoading || user.id === currentUserId}
        >
          <UserX className="h-4 w-4 mr-2" />
          Retirer de l'organisation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
