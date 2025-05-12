
import { useState, useCallback, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

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
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Debug log when users change
  useEffect(() => {
    console.log("OrganizationUsersList - Users received:", users?.length || 0);
  }, [users]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      setError(null);
      await fetchUsers();
      toast.success("Liste des utilisateurs actualisée");
    } catch (error: any) {
      console.error("Error refreshing users:", error);
      setError(error);
      toast.error("Erreur lors de l'actualisation: " + error.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUsers, isRefreshing]);

  const handleRemoveUserFromOrg = async (userId: string) => {
    if (!organizationId || actionLoading) {
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
    if (actionLoading) return;
    
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
    if (!organizationId || actionLoading) {
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
    if (actionLoading) return;
    
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
    if (!organizationId || actionLoading) {
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
    if (actionLoading) return;
    
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

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des utilisateurs: {error.message}
          <button 
            onClick={handleRefresh} 
            className="ml-2 underline"
          >
            Réessayer
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (loading || isRefreshing) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Chargement des utilisateurs...</span>
      </div>
    );
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
