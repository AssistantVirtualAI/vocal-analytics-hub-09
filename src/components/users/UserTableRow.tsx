
import { TableCell, TableRow } from '@/components/ui/table';
import { OrganizationUser } from '@/types/organization';
import { UserStatus, UserRole } from './UserStatus';
import { UserActions } from './UserActions';

interface UserTableRowProps {
  user: OrganizationUser;
  currentUserId: string | undefined;
  actionLoading: boolean;
  onRemoveUser: (userId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onResendInvitation: (email: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

export const UserTableRow = ({
  user,
  currentUserId,
  actionLoading,
  onRemoveUser,
  onCancelInvitation,
  onResendInvitation,
  onResetPassword
}: UserTableRowProps) => {
  // Log for debugging
  console.log("UserTableRow - Rendering user:", user.email);
  
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
      <TableCell className="text-right">
        <UserActions 
          user={user} 
          currentUserId={currentUserId}
          actionLoading={actionLoading}
          onRemoveUser={onRemoveUser}
          onCancelInvitation={onCancelInvitation}
          onResendInvitation={onResendInvitation}
          onResetPassword={onResetPassword}
        />
      </TableCell>
    </TableRow>
  );
};
