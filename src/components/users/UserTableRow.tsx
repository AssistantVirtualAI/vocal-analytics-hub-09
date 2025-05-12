
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { OrganizationUser } from '@/types/organization';
import { UserStatus } from './UserStatus';
import { UserActions } from './UserActions';

interface UserTableRowProps {
  user: OrganizationUser;
  currentUserId?: string;
  actionLoading: boolean;
  isResendingFor: string | null;
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
  isResendingFor,
  onRemoveUser,
  onCancelInvitation,
  onResendInvitation,
  onResetPassword,
  onToggleOrgAdmin,
  onToggleSuperAdmin,
  currentUserIsOrgAdmin,
  currentUserIsSuperAdmin
}: UserTableRowProps) => {
  // Calculate if this specific row is in resending state
  const isResendingThisRow = isResendingFor === user.email;
  const displayName = user.displayName || (user.email?.split('@')[0]) || '-';

  return (
    <TableRow>
      <TableCell className="font-medium">{user.email}</TableCell>
      <TableCell>{displayName}</TableCell>
      <TableCell>
        <UserStatus isPending={user.isPending} />
      </TableCell>
      
      {(currentUserIsOrgAdmin || currentUserIsSuperAdmin) && (
        <>
          <TableCell>{user.isOrgAdmin ? "Admin" : "Utilisateur"}</TableCell>
          {currentUserIsSuperAdmin && <TableCell>{user.isSuperAdmin ? "Oui" : "Non"}</TableCell>}
        </>
      )}
      
      <TableCell className="text-right">
        <UserActions 
          user={user}
          currentUserId={currentUserId}
          actionLoading={actionLoading}
          isResendingFor={isResendingThisRow}
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
}
