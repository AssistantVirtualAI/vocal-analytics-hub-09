
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationSelector } from '@/components/users/OrganizationSelector';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { OrganizationUsersList } from '@/components/users/OrganizationUsersList';
import { Organization, OrganizationUser } from '@/types/organization';

interface OrganizationUsersSectionProps {
  organizations: Organization[];
  selectedOrg: string | null;
  onSelectOrg: (orgId: string) => void;
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
  onAddUser: (email: string) => Promise<void>;
  loading: boolean;
}

export const OrganizationUsersSection: React.FC<OrganizationUsersSectionProps> = ({
  organizations,
  selectedOrg,
  onSelectOrg,
  users,
  fetchUsers,
  onAddUser,
  loading
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Utilisateurs par organisation</CardTitle>
          <CardDescription>Gérez les utilisateurs pour chaque organisation</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <OrganizationSelector 
            organizations={organizations}
            selectedOrg={selectedOrg}
            onSelectOrg={onSelectOrg}
          />
          
          <AddUserDialog onAddUser={onAddUser} loading={loading} />
        </div>
      </CardHeader>
      <CardContent>
        <OrganizationUsersList
          users={users}
          fetchUsers={fetchUsers}
          organizationId={selectedOrg || ''}
        />
      </CardContent>
    </Card>
  );
};
