
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AllUsersList } from '@/components/users/AllUsersList';
import { OrganizationUser } from '@/types/organization';

interface AllUsersSectionProps {
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
  loading?: boolean;
  loadAllUsers: () => void;
}

export const AllUsersSection: React.FC<AllUsersSectionProps> = ({ 
  users, 
  fetchUsers, 
  loading = false,
  loadAllUsers 
}) => {
  
  useEffect(() => {
    // Only load users when the component mounts
    loadAllUsers();
  }, [loadAllUsers]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tous les utilisateurs</CardTitle>
        <CardDescription>Gérez les rôles des utilisateurs dans le système</CardDescription>
      </CardHeader>
      <CardContent>
        <AllUsersList users={users} fetchUsers={fetchUsers} loading={loading} />
      </CardContent>
    </Card>
  );
};
