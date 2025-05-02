
import { Organization, OrganizationUser } from '@/types/organization';
import { OrganizationUsers } from '@/components/organizations/OrganizationUsers';

interface OrganizationUserManagementSectionProps {
  currentOrganization: Organization | null;
  users: OrganizationUser[];
  fetchOrganizationUsers: (organizationId: string) => Promise<void>;
  addUserToOrganization: (email: string, organizationId: string) => Promise<void>;
  removeUserFromOrganization: (userId: string, organizationId: string) => Promise<void>;
}

export const OrganizationUserManagementSection = ({
  currentOrganization,
  users,
  fetchOrganizationUsers,
  addUserToOrganization,
  removeUserFromOrganization
}: OrganizationUserManagementSectionProps) => {
  return (
    <OrganizationUsers
      currentOrganization={currentOrganization}
      users={users}
      fetchOrganizationUsers={fetchOrganizationUsers}
      addUserToOrganization={addUserToOrganization}
      removeUserFromOrganization={removeUserFromOrganization}
    />
  );
};
