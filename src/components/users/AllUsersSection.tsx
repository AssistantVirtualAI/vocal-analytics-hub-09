
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AllUsersList } from '@/components/users/AllUsersList';
import { OrganizationUser } from '@/types/organization';

interface AllUsersSectionProps {
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
}

export const AllUsersSection: React.FC<AllUsersSectionProps> = ({ users, fetchUsers }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tous les utilisateurs</CardTitle>
        <CardDescription>Gérez les rôles des utilisateurs dans le système</CardDescription>
      </CardHeader>
      <CardContent>
        <AllUsersList users={users} fetchUsers={fetchUsers} />
      </CardContent>
    </Card>
  );
};
