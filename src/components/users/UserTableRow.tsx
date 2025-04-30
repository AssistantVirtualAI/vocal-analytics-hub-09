
import React, { useEffect } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { OrganizationUser } from '@/types/organization';
import { UserStatus } from './UserStatus';
import { UserActions } from './UserActions';

interface UserTableRowProps {
  user: OrganizationUser;
  currentUserId?: string;
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
  // Add logging for debugging
  useEffect(() => {
    console.log("UserTableRow - Rendering user:", user);
  }, [user]);

  return (
    <TableRow>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.displayName || (user.email?.split('@')[0]) || '-'}</TableCell>
      <TableCell>
        {/* Pass the isPending prop directly to UserStatus */}
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
          isResendingFor={isResendingFor}
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
