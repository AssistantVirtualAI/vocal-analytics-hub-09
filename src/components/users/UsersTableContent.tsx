
import { TableBody } from '@/components/ui/table';
import { OrganizationUser } from '@/types/organization';
import { UserTableSkeleton } from './UserTableSkeleton';
import { UserTableRow } from './UserTableRow';
import { UsersEmptyState } from './UsersEmptyState';

interface UsersTableContentProps {
  users: OrganizationUser[];
  loading: boolean;
  actionLoading: boolean;
  resendingFor: string | null;
  currentUserId?: string;
  currentUserIsOrgAdmin?: boolean;
  currentUserIsSuperAdmin?: boolean;
  onRemoveUser: (userId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onResendInvitation: (email: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onToggleOrgAdmin?: (userId: string, makeAdmin: boolean) => Promise<void>;
  onToggleSuperAdmin?: (userId: string, makeAdmin: boolean) => Promise<void>;
}

export const UsersTableContent = ({
  users,
  loading,
  actionLoading,
  resendingFor,
  currentUserId,
  currentUserIsOrgAdmin = false,
  currentUserIsSuperAdmin = false,
  onRemoveUser,
  onCancelInvitation,
  onResendInvitation,
  onResetPassword,
  onToggleOrgAdmin,
  onToggleSuperAdmin
}: UsersTableContentProps) => {
  
  if (loading) {
    return <UserTableSkeleton />;
  }

  return (
    <TableBody>
      {users.length > 0 ? (
        users.map((userItem) => (
          <UserTableRow
            key={userItem.id}
            user={userItem}
            currentUserId={currentUserId}
            actionLoading={actionLoading}
            isResendingFor={resendingFor}
            onRemoveUser={onRemoveUser}
            onCancelInvitation={onCancelInvitation}
            onResendInvitation={onResendInvitation}
            onResetPassword={onResetPassword}
            onToggleOrgAdmin={currentUserIsOrgAdmin || currentUserIsSuperAdmin ? onToggleOrgAdmin : undefined}
            onToggleSuperAdmin={currentUserIsSuperAdmin ? onToggleSuperAdmin : undefined}
            currentUserIsOrgAdmin={currentUserIsOrgAdmin}
            currentUserIsSuperAdmin={currentUserIsSuperAdmin}
          />
        ))
      ) : (
        <UsersEmptyState 
          loading={loading} 
          colSpan={(currentUserIsOrgAdmin || currentUserIsSuperAdmin) ? 6 : 5} 
        />
      )}
    </TableBody>
  );
};
