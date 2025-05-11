
import { useAuth } from '@/context/AuthContext';
import { 
  useUserAddition,
  useUserRemoval,
  usePasswordReset,
  useInvitationManagement,
  useAdminRoles
} from './organization';

export const useUserOrganizationManagement = (
  selectedOrg: string | null, 
  refreshUsers?: () => Promise<void>
) => {
  // Get current user id
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Load sub-hooks
  const { loading: addingUser, addUserToOrg } = useUserAddition(selectedOrg, refreshUsers);
  const { loading: removingUser, removeUserFromOrg } = useUserRemoval(selectedOrg, refreshUsers);
  const { loading: resettingPassword, resetPassword } = usePasswordReset();
  const { 
    loading: managingInvitations, 
    cancelInvitation,
    resendInvitation,
    resendingFor
  } = useInvitationManagement(selectedOrg, refreshUsers);
  const {
    loading: managingRoles,
    toggleOrganizationAdmin,
    toggleSuperAdmin,
    checkCurrentUserPermissions,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin
  } = useAdminRoles(selectedOrg, currentUserId, refreshUsers);

  // Combine loading states
  const loading = addingUser || removingUser || resettingPassword || managingInvitations || managingRoles;

  return {
    loading,
    addUserToOrg,
    removeUserFromOrg,
    resetPassword,
    cancelInvitation,
    resendInvitation,
    resendingFor,
    toggleOrganizationAdmin,
    toggleSuperAdmin,
    checkCurrentUserPermissions,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin,
    currentUserId
  };
};
