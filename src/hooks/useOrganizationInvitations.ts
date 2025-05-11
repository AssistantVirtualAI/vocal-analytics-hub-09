
import { useState } from 'react';
import { OrganizationInvitation } from '@/types/invitation';

export const useOrganizationInvitations = () => {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);

  return {
    invitations,
    setInvitations
  };
};
