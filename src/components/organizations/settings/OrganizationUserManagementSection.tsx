
import { Organization, OrganizationUser } from '@/types/organization';
import { OrganizationUsers } from '@/components/organizations/OrganizationUsers';

interface OrganizationUserManagementSectionProps {
  currentOrganization: Organization | null;
  users: OrganizationUser[];
  addUserToOrganization: (email: string, role?: string) => Promise<void>;
  removeUserFromOrganization: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
}

export const OrganizationUserManagementSection = ({
  currentOrganization,
  users,
  addUserToOrganization,
  removeUserFromOrganization,
  updateUserRole
}: OrganizationUserManagementSectionProps) => {
  return (
    <OrganizationUsers
      currentOrganization={currentOrganization}
      users={users}
      fetchOrganizationUsers={() => Promise.resolve()} // This is handled internally in the parent component now
      addUserToOrganization={addUserToOrganization}
      removeUserFromOrganization={removeUserFromOrganization}
      onUpdateUserRole={updateUserRole}
    />
  );
};
