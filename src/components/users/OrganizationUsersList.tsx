
import { useState } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { OrganizationUser } from '@/types/organization';
import { useAuth } from '@/context/AuthContext';
import { 
  removeUserFromOrganization, 
  cancelInvitation, 
  resendInvitation, 
  resetUserPassword 
} from '@/services/organization/userManagement';
import { toast } from 'sonner';
import { UserTableHeader } from './UserTableHeader';
import { UserTableSkeleton } from './UserTableSkeleton';
import { UserTableRow } from './UserTableRow';

interface OrganizationUsersListProps {
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
  organizationId: string;
  loading?: boolean;
}

export const OrganizationUsersList = ({ 
  users, 
  fetchUsers, 
  organizationId, 
  loading = false 
}: OrganizationUsersListProps) => {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  
  // Log for debugging
  console.log("OrganizationUsersList - Current users:", users);
  console.log("OrganizationUsersList - Organization ID:", organizationId);
  console.log("OrganizationUsersList - Current auth user:", user);

  const handleRemoveUserFromOrg = async (userId: string) => {
    if (!organizationId) {
      toast("ID d'organisation non spécifié");
      return;
    }
    
    setActionLoading(true);
    try {
      console.log(`Attempting to remove user ${userId} from org ${organizationId}`);
      await removeUserFromOrganization(userId, organizationId);
      await fetchUsers();
    } catch (error) {
      // Error is already handled in the service function
      console.error("Error removing user from org:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(true);
    try {
      console.log(`Attempting to cancel invitation ${invitationId}`);
      await cancelInvitation(invitationId);
      await fetchUsers();
    } catch (error) {
      // Error is already handled in the service function
      console.error("Error cancelling invitation:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvitation = async (email: string) => {
    if (!organizationId) {
      toast("ID d'organisation non spécifié");
      return;
    }
    
    setActionLoading(true);
    try {
      console.log(`Attempting to resend invitation to ${email} for org ${organizationId}`);
      await resendInvitation(email, organizationId);
      await fetchUsers();
    } catch (error) {
      // Error is already handled in the service function
      console.error("Error resending invitation:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setActionLoading(true);
    try {
      console.log(`Attempting to reset password for ${email}`);
      await resetUserPassword(email);
    } catch (error) {
      // Error is already handled in the service function
      console.error("Error resetting password:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Table>
      <UserTableHeader />
      {loading ? (
        <UserTableSkeleton />
      ) : (
        <TableBody>
          {users.map((userItem) => (
            <UserTableRow
              key={userItem.id}
              user={userItem}
              currentUserId={user?.id}
              actionLoading={actionLoading}
              onRemoveUser={handleRemoveUserFromOrg}
              onCancelInvitation={handleCancelInvitation}
              onResendInvitation={handleResendInvitation}
              onResetPassword={handleResetPassword}
            />
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Aucun utilisateur dans cette organisation
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      )}
    </Table>
  );
};
