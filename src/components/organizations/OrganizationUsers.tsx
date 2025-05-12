
import { Organization, OrganizationUser } from '@/types/organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddUserDialog } from './users/AddUserDialog';
import { OrganizationUsersTable } from './users/OrganizationUsersTable';
import { useOrganizationInvitations } from '@/hooks/useOrganizationInvitations';
import { useEffect, useRef } from 'react';

interface OrganizationUsersProps {
  currentOrganization: Organization | null;
  users: OrganizationUser[];
  fetchOrganizationUsers: (organizationId: string) => Promise<void> | void;
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
  const currentOrgId = useRef<string | null>(null);

  // Fetch users only once when the component mounts or when the organization changes
  useEffect(() => {
    if (!currentOrganization) {
      fetchInitiated.current = false;
      return;
    }
    
    // Only fetch if the organization has changed or we haven't fetched yet
    if (!fetchInitiated.current || currentOrgId.current !== currentOrganization.id) {
      console.log(`OrganizationUsers: Initial fetch for org ${currentOrganization.id}`);
      fetchOrganizationUsers(currentOrganization.id);
      fetchInitiated.current = true;
      currentOrgId.current = currentOrganization.id;
    }
  }, [currentOrganization, fetchOrganizationUsers]);

  const handleAddUser = async (newUserEmail: string) => {
    if (!currentOrganization || !newUserEmail) return;
    
    try {
      await addUserToOrganization(newUserEmail, currentOrganization.id);
      // Don't need to fetch again as addUserToOrganization already does this
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!currentOrganization) return;
    
    try {
      await removeUserFromOrganization(userId, currentOrganization.id);
      // Don't need to fetch again as removeUserFromOrganization already does this
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (!onUpdateUserRole || !currentOrganization) return;
    
    try {
      await onUpdateUserRole(userId, role);
    } catch (error) {
      console.error("Error updating role:", error);
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
