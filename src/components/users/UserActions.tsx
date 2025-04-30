import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserX, RefreshCw, KeyRound, ShieldCheck, Shield } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { OrganizationUser } from '@/types/organization';
import { toast } from 'sonner';

interface UserActionsProps {
  user: OrganizationUser;
  currentUserId: string | undefined;
  actionLoading: boolean;
  isResendingFor?: string | null;
  onRemoveUser: (userId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onResendInvitation: (email: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onToggleOrgAdmin?: (userId: string, makeAdmin: boolean) => Promise<void>;
  onToggleSuperAdmin?: (userId: string, makeAdmin: boolean) => Promise<void>;
  currentUserIsOrgAdmin?: boolean;
  currentUserIsSuperAdmin?: boolean;
}

export const UserActions = ({
  user,
  currentUserId,
  actionLoading,
  isResendingFor,
  onRemoveUser,
  onCancelInvitation,
  onResendInvitation,
  onResetPassword,
  onToggleOrgAdmin,
  onToggleSuperAdmin,
  currentUserIsOrgAdmin = false,
  currentUserIsSuperAdmin = false
}: UserActionsProps) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Log for debugging whenever the component renders
  useEffect(() => {
    console.log("UserActions - Rendering for user:", user.email, "isPending:", user.isPending);
  }, [user]);
  
  const handleResendInvitation = async () => {
    if (!user.email) {
      toast.error("Adresse email non disponible");
      return;
    }
    
    console.log("Resending invitation for:", user.email);
    try {
      await onResendInvitation(user.email);
      console.log("Invitation resent successfully for:", user.email);
    } catch (error: any) {
      console.error("Error resending invitation:", error);
    }
  };
  
  const handleCancelInvitation = async () => {
    setCancelLoading(true);
    try {
      await onCancelInvitation(user.id);
    } catch (error: any) {
      console.error("Error canceling invitation:", error);
    } finally {
      setCancelLoading(false);
    }
  };

  const isResendingForThisUser = isResendingFor === user.email;
  
  if (user.isPending) {
    return (
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResendInvitation}
          disabled={actionLoading || localLoading || isResendingForThisUser || cancelLoading}
        >
          {isResendingForThisUser ? (
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
          disabled={actionLoading || localLoading || isResendingForThisUser || cancelLoading}
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
        
        {onToggleOrgAdmin && currentUserIsOrgAdmin && user.id !== currentUserId && (
          <DropdownMenuItem 
            onClick={() => onToggleOrgAdmin(user.id, !user.isOrgAdmin)}
            disabled={actionLoading || localLoading}
          >
            {user.isOrgAdmin ? (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Révoquer admin d'organisation
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Nommer admin d'organisation
              </>
            )}
          </DropdownMenuItem>
        )}

        {onToggleSuperAdmin && currentUserIsSuperAdmin && user.id !== currentUserId && (
          <DropdownMenuItem 
            onClick={() => onToggleSuperAdmin(user.id, !user.isSuperAdmin)}
            disabled={actionLoading || localLoading}
          >
            {user.isSuperAdmin ? (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Révoquer super admin
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Nommer super admin
              </>
            )}
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
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
