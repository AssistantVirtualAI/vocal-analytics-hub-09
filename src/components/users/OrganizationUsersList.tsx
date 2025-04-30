
import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { 
  setOrganizationAdminStatus, 
  setSuperAdminStatus 
} from '@/services/organization/users/adminRoles';
import { toast } from 'sonner';
import { UserTableHeader } from './UserTableHeader';
import { UsersListHeader } from './UsersListHeader';
import { UsersTableContent } from './UsersTableContent';
import { OrganizationUser } from '@/types/organization';
import { 
  removeUserFromOrganization, 
  cancelInvitation, 
  resendInvitation, 
  resetUserPassword 
} from '@/services/organization/userManagement';

interface OrganizationUsersListProps {
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
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
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  
  // Debug log when users change
  console.log("OrganizationUsersList - Current users:", users);

  const handleRefresh = async () => {
    try {
      await fetchUsers();
      toast.success("Liste des utilisateurs actualisée");
    } catch (error: any) {
      toast.error("Erreur lors de l'actualisation: " + error.message);
    }
  };

  const handleRemoveUserFromOrg = async (userId: string) => {
    if (!organizationId) {
      toast.error("ID d'organisation non spécifié");
      return;
    }
    
    setActionLoading(true);
    try {
      console.log(`Attempting to remove user ${userId} from org ${organizationId}`);
      await removeUserFromOrganization(userId, organizationId);
      await fetchUsers();
    } catch (error) {
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
      console.error("Error cancelling invitation:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvitation = async (email: string) => {
    if (!organizationId) {
      toast.error("ID d'organisation non spécifié");
      return;
    }
    
    setResendingFor(email);
    setActionLoading(true);
    try {
      console.log(`Attempting to resend invitation to ${email} for org ${organizationId}`);
      await resendInvitation(email, organizationId);
      await fetchUsers();
    } catch (error) {
      console.error("Error resending invitation:", error);
    } finally {
      setResendingFor(null);
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setActionLoading(true);
    try {
      console.log(`Attempting to reset password for ${email}`);
      await resetUserPassword(email);
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleOrgAdmin = async (userId: string, makeAdmin: boolean) => {
    if (!organizationId) {
      toast.error("ID d'organisation non spécifié");
      return;
    }
    
    setActionLoading(true);
    try {
      await setOrganizationAdminStatus(userId, organizationId, makeAdmin);
      await fetchUsers();
    } catch (error) {
      console.error("Error toggling org admin status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuperAdmin = async (userId: string, makeAdmin: boolean) => {
    setActionLoading(true);
    try {
      await setSuperAdminStatus(userId, makeAdmin);
      await fetchUsers();
    } catch (error) {
      console.error("Error toggling super admin status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <UsersListHeader onRefresh={handleRefresh} loading={loading} />
      
      <Table>
        <UserTableHeader showAdminColumns={currentUserIsOrgAdmin || currentUserIsSuperAdmin} />
        <UsersTableContent
          users={users}
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
