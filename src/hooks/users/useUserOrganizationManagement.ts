
import { useState } from 'react';
import { useUserAddition } from './useUserAddition';
import { useUserRemoval } from './useUserRemoval';
import { usePasswordReset } from './usePasswordReset';
import { useInvitationManagement } from './useInvitationManagement';

export const useUserOrganizationManagement = (
  selectedOrg: string | null, 
  refreshUsers?: () => Promise<void>
) => {
  // Load sub-hooks
  const { loading: addingUser, addUserToOrg } = useUserAddition(selectedOrg, refreshUsers);
  const { loading: removingUser, removeUserFromOrg } = useUserRemoval(selectedOrg, refreshUsers);
  const { loading: resettingPassword, resetPassword } = usePasswordReset();
  const { 
    loading: managingInvitations, 
    cancelInvitation,
    resendInvitation
  } = useInvitationManagement(selectedOrg, refreshUsers);

  // Combine loading states
  const loading = addingUser || removingUser || resettingPassword || managingInvitations;

  return {
    loading,
    addUserToOrg,
    removeUserFromOrg,
    resetPassword,
    cancelInvitation,
    resendInvitation
  };
};
