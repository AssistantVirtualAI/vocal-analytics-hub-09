
import { Organization, OrganizationUser } from '@/types/organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddUserDialog } from './users/AddUserDialog';
import { OrganizationUsersTable } from './users/OrganizationUsersTable';
import { useOrganizationInvitations } from '@/hooks/useOrganizationInvitations';
import { useEffect, useRef } from 'react';

interface OrganizationUsersProps {
  currentOrganization: Organization | null;
  users: OrganizationUser[];
  fetchOrganizationUsers: (organizationId: string) => Promise<void>;
  addUserToOrganization: (email: string, organizationId: string) => Promise<void>;
  removeUserFromOrganization: (userId: string, organizationId: string) => Promise<void>;
  onUpdateUserRole?: (userId: string, role: string) => Promise<void>;
}

export const OrganizationUsers = ({
  currentOrganization,
  users,
  fetchOrganizationUsers,
  addUserToOrganization,
  removeUserFromOrganization,
  onUpdateUserRole
}: OrganizationUsersProps) => {
  const { pendingInvitations, cancelInvitation } = useOrganizationInvitations(currentOrganization?.id || null);
  const fetchInitiated = useRef(false);

  // Fetch users only once when the component mounts or when the organization changes
  useEffect(() => {
    if (currentOrganization && !fetchInitiated.current) {
      fetchOrganizationUsers(currentOrganization.id);
      fetchInitiated.current = true;
    }
    
    return () => {
      // Reset when component unmounts or org changes
      fetchInitiated.current = false;
    };
  }, [currentOrganization, fetchOrganizationUsers]);

  const handleAddUser = async (newUserEmail: string) => {
    if (currentOrganization && newUserEmail) {
      await addUserToOrganization(newUserEmail, currentOrganization.id);
      if (currentOrganization) {
        await fetchOrganizationUsers(currentOrganization.id);
      }
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (currentOrganization) {
      await removeUserFromOrganization(userId, currentOrganization.id);
      await fetchOrganizationUsers(currentOrganization.id);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (onUpdateUserRole && currentOrganization) {
      await onUpdateUserRole(userId, role);
    }
  };

  if (!currentOrganization) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">Utilisateurs - {currentOrganization.name}</CardTitle>
          <CardDescription>Gérer les utilisateurs de cette organisation</CardDescription>
        </div>
        
        <AddUserDialog onAddUser={handleAddUser} />
      </CardHeader>
      <CardContent>
        <OrganizationUsersTable
          users={users}
          pendingInvitations={pendingInvitations}
          onRemoveUser={handleRemoveUser}
          onCancelInvitation={cancelInvitation}
          onUpdateRole={handleUpdateRole}
        />
      </CardContent>
    </Card>
  );
};
