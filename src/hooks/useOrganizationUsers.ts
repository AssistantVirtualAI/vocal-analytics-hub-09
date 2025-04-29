
import { useState } from 'react';
import { OrganizationUser } from '@/types/organization';

export const useOrganizationUsers = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);

  return {
    users,
    setUsers
  };
};
