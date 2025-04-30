
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { OrganizationUser } from '@/types/organization';
import { InvitationActions } from './actions/InvitationActions';
import { AdminActions } from './actions/AdminActions';
import { UserActionItems } from './actions/UserActionItems';

interface UserActionsProps {
  user: OrganizationUser;
  currentUserId: string | undefined;
  actionLoading: boolean;
  isResendingFor?: boolean;  // Changed to boolean to match how it's used
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
  
  // Log for debugging whenever the component renders
  useEffect(() => {
    console.log("UserActions - Rendering for user:", user.email, "isPending:", user.isPending);
  }, [user]);

  const isCurrentUser = user.id === currentUserId;
  
  if (user.isPending) {
    return (
      <InvitationActions
        email={user.email}
        invitationId={user.id}
        isResendingFor={!!isResendingFor}  // Convert to boolean if undefined
        actionLoading={actionLoading || localLoading}
        onResendInvitation={onResendInvitation}
        onCancelInvitation={onCancelInvitation}
      />
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={actionLoading || localLoading || isCurrentUser}>
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <UserActionItems
          userId={user.id}
          email={user.email}
          currentUserIsSameUser={isCurrentUser}
          actionLoading={actionLoading || localLoading}
          onResetPassword={onResetPassword}
          onRemoveUser={onRemoveUser}
        />
        
        <AdminActions
          userId={user.id}
          isOrgAdmin={!!user.isOrgAdmin}
          isSuperAdmin={!!user.isSuperAdmin}
          currentUserIsSameUser={isCurrentUser}
          currentUserIsOrgAdmin={currentUserIsOrgAdmin}
          currentUserIsSuperAdmin={currentUserIsSuperAdmin}
          actionLoading={actionLoading || localLoading}
          onToggleOrgAdmin={onToggleOrgAdmin}
          onToggleSuperAdmin={onToggleSuperAdmin}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
