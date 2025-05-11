import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Organization, OrganizationUser } from '@/types/organization';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchOrganizations, 
  updateOrganization as updateOrg,
  createOrganization as createOrg,
  deleteOrganization as deleteOrg
} from '@/services/organization';
import { 
  fetchOrganizationUsers, 
  addUserToOrganization, 
  removeUserFromOrganization,
  updateUserRole
} from '@/services/organization/users';
import { toast } from '@/hooks/use-toast';

export const useOrganizationState = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userHasAdminAccessToCurrentOrg, setUserHasAdminAccessToCurrentOrg] = useState<boolean>(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const loadOrganizations = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const orgs = await fetchOrganizations();
      setOrganizations(orgs);
      
      // If we have organizations but no current one selected, select the first one
      if (orgs.length > 0 && !currentOrganization) {
        setCurrentOrganization(orgs[0]);
        loadOrganizationUsers(orgs[0].id);
      } else if (currentOrganization) {
        // If we already have a selected org, refresh its data
        const updatedOrg = orgs.find(org => org.id === currentOrganization.id);
        if (updatedOrg) {
          setCurrentOrganization(updatedOrg);
        } else if (orgs.length > 0) {
          // If the current org no longer exists, select the first available one
          setCurrentOrganization(orgs[0]);
          loadOrganizationUsers(orgs[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizationUsers = async (organizationId: string) => {
    if (!organizationId) return;
    
    try {
      const orgUsers = await fetchOrganizationUsers(organizationId);
      setUsers(orgUsers);
    } catch (error) {
      console.error("Error loading organization users:", error);
      toast({
        title: "Error",
        description: "Failed to load organization users",
        variant: "destructive",
      });
    }
  };

  const changeOrganization = (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      loadOrganizationUsers(org.id);
      
      // Update URL to reflect the selected organization
      navigate(`/org/${org.slug || org.id}/dashboard`);
    }
  };

  const createOrganization = async (name: string, description?: string, agentId?: string): Promise<string> => {
    try {
      const orgId = await createOrg(name, description, agentId);
      await loadOrganizations();
      return orgId;
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
      return '';
    }
  };

  const updateOrganization = async (organization: Organization): Promise<void> => {
    try {
      await updateOrg(organization.id, organization.name, organization.description, organization.agentId);
      await loadOrganizations();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  const deleteOrganization = async (organizationId: string): Promise<void> => {
    try {
      await deleteOrg(organizationId);
      
      // If we deleted the current organization, select another one
      if (currentOrganization && currentOrganization.id === organizationId) {
        setCurrentOrganization(null);
      }
      
      await loadOrganizations();
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    }
  };

  const addUser = async (email: string, role: string = 'user'): Promise<void> => {
    if (!currentOrganization) return;
    
    try {
      await addUserToOrganization(currentOrganization.id, email, role);
      await loadOrganizationUsers(currentOrganization.id);
      toast({
        title: "Success",
        description: `User ${email} has been invited to the organization`,
      });
    } catch (error) {
      console.error("Error adding user to organization:", error);
      toast({
        title: "Error",
        description: "Failed to add user to organization",
        variant: "destructive",
      });
    }
  };

  const removeUser = async (userId: string): Promise<void> => {
    if (!currentOrganization) return;
    
    try {
      await removeUserFromOrganization(currentOrganization.id, userId);
      await loadOrganizationUsers(currentOrganization.id);
      toast({
        title: "Success",
        description: "User has been removed from the organization",
      });
    } catch (error) {
      console.error("Error removing user from organization:", error);
      toast({
        title: "Error",
        description: "Failed to remove user from organization",
        variant: "destructive",
      });
    }
  };

  const updateUser = async (userId: string, role: string): Promise<void> => {
    if (!currentOrganization) return;
    
    try {
      await updateUserRole(currentOrganization.id, userId, role);
      await loadOrganizationUsers(currentOrganization.id);
      toast({
        title: "Success",
        description: "User role has been updated",
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user || isAdmin) {
      loadOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setUsers([]);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    // Check if the user has admin access to the current organization
    if (currentOrganization && user) {
      // Global admin always has access
      if (isAdmin) {
        setUserHasAdminAccessToCurrentOrg(true);
        return;
      }
      
      // Check if user is an admin in this specific organization
      const userInOrg = users.find(u => u.user_id === user.id);
      setUserHasAdminAccessToCurrentOrg(userInOrg?.role === 'admin');
    } else {
      setUserHasAdminAccessToCurrentOrg(false);
    }
  }, [currentOrganization, user, isAdmin, users]);

  return {
    currentOrganization,
    organizations,
    users,
    changeOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addUser,
    removeUser,
    updateUser,
    isLoading,
    userHasAdminAccessToCurrentOrg
  };
};
