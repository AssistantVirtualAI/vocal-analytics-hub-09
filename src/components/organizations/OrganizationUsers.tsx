
import { Organization, OrganizationUser } from '@/types/organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddUserDialog } from './users/AddUserDialog';
import { OrganizationUsersTable } from './users/OrganizationUsersTable';
import { useOrganizationInvitations } from '@/hooks/useOrganizationInvitations';
import { useEffect, useRef, useState } from 'react';

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
  const hasInitiallyLoaded = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const fetchInProgressRef = useRef(false);
  const orgIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log("OrganizationUsers: Cleaning up");
      isMountedRef.current = false;
      fetchInProgressRef.current = false;
      hasInitiallyLoaded.current = false;
      orgIdRef.current = null;
    };
  }, []);

  // Only fetch users once when the component mounts or when the organization changes
  useEffect(() => {
    if (!currentOrganization) {
      hasInitiallyLoaded.current = false;
      orgIdRef.current = null;
      return;
    }

    const orgId = currentOrganization.id;
    
    // Skip if already loading or if already loaded for this org
    if (fetchInProgressRef.current || (hasInitiallyLoaded.current && orgId === orgIdRef.current)) {
      return;
    }
    
    // Mark that we're starting a fetch
    fetchInProgressRef.current = true;
    
    console.log(`OrganizationUsers: Fetch for org ${orgId} (previous: ${orgIdRef.current})`);
    
    // Use a microtask to avoid state updates during render
    const fetchData = async () => {
      try {
        await fetchOrganizationUsers(orgId);
      } catch (error) {
        console.error("Error fetching organization users:", error);
      } finally {
        if (isMountedRef.current) {
          hasInitiallyLoaded.current = true;
          setIsInitialLoad(false);
          fetchInProgressRef.current = false;
          orgIdRef.current = orgId;
        }
      }
    };
    
    fetchData();
  }, [currentOrganization, fetchOrganizationUsers]);

  const handleAddUser = async (newUserEmail: string) => {
    if (!currentOrganization || !newUserEmail) return;
    
    try {
      await addUserToOrganization(newUserEmail, currentOrganization.id);
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!currentOrganization) return;
    
    try {
      await removeUserFromOrganization(userId, currentOrganization.id);
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

  console.log(`OrganizationUsers: Rendering for org ${currentOrganization.id} with ${users?.length || 0} users`);

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
          users={users || []}
          pendingInvitations={pendingInvitations || []}
          onRemoveUser={handleRemoveUser}
          onCancelInvitation={cancelInvitation}
          onUpdateRole={handleUpdateRole}
        />
      </CardContent>
    </Card>
  );
};
