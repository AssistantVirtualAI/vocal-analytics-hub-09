
import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { OrganizationUser } from '@/types/organization';
import { UserTableHeader } from './UserTableHeader';
import { UsersListHeader } from './UsersListHeader';
import { UsersTableContent } from './UsersTableContent';
import { UsersListError } from './list/UsersListError';
import { UsersListLoading } from './list/UsersListLoading';
import { useOrganizationUsersActions } from '@/hooks/users/useOrganizationUsersActions';

interface OrganizationUsersListProps {
  users: OrganizationUser[];
  fetchUsers: () => Promise<void> | void;
  organizationId: string;
  loading?: boolean;
  currentUserIsOrgAdmin?: boolean;
  currentUserIsSuperAdmin?: boolean;
}

export const OrganizationUsersList = ({ 
  users, 
  fetchUsers, 
  organizationId, 
  loading = false,
  currentUserIsOrgAdmin = false,
  currentUserIsSuperAdmin = false
}: OrganizationUsersListProps) => {
  const { user } = useAuth();
  
  // Use our custom hook for all user actions
  const {
    actionLoading,
    resendingFor,
    isRefreshing,
    error,
    handleRefresh,
    handleRemoveUserFromOrg,
    handleCancelInvitation,
    handleResendInvitation,
    handleResetPassword,
    handleToggleOrgAdmin,
    handleToggleSuperAdmin
  } = useOrganizationUsersActions({ fetchUsers, organizationId });
  
  // Debug log when users change
  useEffect(() => {
    console.log("OrganizationUsersList - Users received:", users?.length || 0);
  }, [users]);

  // Show error state if there's an error
  if (error) {
    return <UsersListError error={error} onRetry={handleRefresh} />;
  }

  // Show loading state if loading
  if (loading || isRefreshing) {
    return <UsersListLoading />;
  }

  return (
    <div>
      <UsersListHeader onRefresh={handleRefresh} loading={loading || isRefreshing} />
      
      <Table>
        <UserTableHeader showAdminColumns={currentUserIsOrgAdmin || currentUserIsSuperAdmin} />
        <UsersTableContent
          users={users || []}
          loading={loading}
          actionLoading={actionLoading}
          resendingFor={resendingFor}
          currentUserId={user?.id}
          currentUserIsOrgAdmin={currentUserIsOrgAdmin}
          currentUserIsSuperAdmin={currentUserIsSuperAdmin}
          onRemoveUser={handleRemoveUserFromOrg}
          onCancelInvitation={handleCancelInvitation}
          onResendInvitation={handleResendInvitation}
          onResetPassword={handleResetPassword}
          onToggleOrgAdmin={handleToggleOrgAdmin}
          onToggleSuperAdmin={handleToggleSuperAdmin}
        />
      </Table>
    </div>
  );
};
