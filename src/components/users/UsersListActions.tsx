
import { OrganizationUser } from '@/types/organization';
import { useEffect } from 'react';

interface UsersListActionsProps {
  users: OrganizationUser[];
  handleRemoveUserFromOrg: (userId: string) => Promise<void>;
  handleCancelInvitation: (invitationId: string) => Promise<void>;
  handleResendInvitation: (email: string) => Promise<void>;
  handleResetPassword: (email: string) => Promise<void>;
  handleToggleOrgAdmin: (userId: string, makeAdmin: boolean) => Promise<void>;
  handleToggleSuperAdmin: (userId: string, makeAdmin: boolean) => Promise<void>;
}

// This component doesn't render anything directly but contains the action handlers
export const useUsersListActions = ({
  users,
  handleRemoveUserFromOrg,
  handleCancelInvitation,
  handleResendInvitation,
  handleResetPassword,
  handleToggleOrgAdmin,
  handleToggleSuperAdmin
}: UsersListActionsProps) => {
  // Debug logging when users change
  useEffect(() => {
    console.log("useUsersListActions - Users updated:", users.length);
  }, [users]);
  
  // All the handlers are passed through, ready to be used by the parent component
  return {
    handleRemoveUserFromOrg,
    handleCancelInvitation,
    handleResendInvitation,
    handleResetPassword,
    handleToggleOrgAdmin,
    handleToggleSuperAdmin
  };
};
