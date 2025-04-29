
import { useState } from 'react';
import { useUserAddition } from './useUserAddition';
import { useUserRemoval } from './useUserRemoval';
import { usePasswordReset } from './usePasswordReset';
import { useInvitationManagement } from './useInvitationManagement';
import { useAdminRoles } from './useAdminRoles';
import { useAuth } from '@/context/AuthContext';

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
    resendInvitation
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
    toggleOrganizationAdmin,
    toggleSuperAdmin,
    checkCurrentUserPermissions,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin,
    currentUserId
  };
};
