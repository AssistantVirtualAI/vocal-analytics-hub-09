
import { TableCell, TableRow } from '@/components/ui/table';
import { OrganizationUser } from '@/types/organization';
import { UserStatus, UserRole } from './UserStatus';
import { UserActions } from './UserActions';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface UserTableRowProps {
  user: OrganizationUser;
  currentUserId: string | undefined;
  actionLoading: boolean;
  onRemoveUser: (userId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onResendInvitation: (email: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onToggleOrgAdmin?: (userId: string, makeAdmin: boolean) => Promise<void>;
  onToggleSuperAdmin?: (userId: string, makeAdmin: boolean) => Promise<void>;
  currentUserIsOrgAdmin?: boolean;
  currentUserIsSuperAdmin?: boolean;
}

export const UserTableRow = ({
  user,
  currentUserId,
  actionLoading,
  onRemoveUser,
  onCancelInvitation,
  onResendInvitation,
  onResetPassword,
  onToggleOrgAdmin,
  onToggleSuperAdmin,
  currentUserIsOrgAdmin = false,
  currentUserIsSuperAdmin = false
}: UserTableRowProps) => {
  // Log for debugging
  useEffect(() => {
    console.log("UserTableRow - Rendering user:", user);
  }, [user]);
  
  return (
    <TableRow key={user.id}>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.displayName || user.email?.split('@')[0] || ''}</TableCell>
      <TableCell>
        <UserStatus user={user} />
      </TableCell>
      <TableCell>
        <UserRole user={user} />
      </TableCell>
      {(currentUserIsOrgAdmin || currentUserIsSuperAdmin) && (
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {user.isOrgAdmin && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                Admin Org
              </Badge>
            )}
            {user.isSuperAdmin && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                Super Admin
              </Badge>
            )}
          </div>
        </TableCell>
      )}
      <TableCell className="text-right">
        <UserActions 
          user={user} 
          currentUserId={currentUserId}
          actionLoading={actionLoading}
          onRemoveUser={onRemoveUser}
          onCancelInvitation={onCancelInvitation}
          onResendInvitation={onResendInvitation}
          onResetPassword={onResetPassword}
          onToggleOrgAdmin={onToggleOrgAdmin}
          onToggleSuperAdmin={onToggleSuperAdmin}
          currentUserIsOrgAdmin={currentUserIsOrgAdmin}
          currentUserIsSuperAdmin={currentUserIsSuperAdmin}
        />
      </TableCell>
    </TableRow>
  );
};
