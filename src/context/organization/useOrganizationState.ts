
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/auth/useUserSession'; 
import { Organization, OrganizationUser } from '@/types/organization';
import { 
  fetchOrganizations,
  fetchOrganization
} from '@/services/organization';
import { 
  createOrg, 
  updateOrg, 
  deleteOrg 
} from '@/services/organization/crudOperations';
import { 
  fetchOrganizationUsers, 
  addUserToOrganization, 
  removeUserFromOrganization
} from '@/services/organization/users';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'current_organization_id';

export function useOrganizationState() {
  const { session, userDetails, isLoading: sessionLoading } = useUserSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userHasAdminAccessToCurrentOrg, setUserHasAdminAccessToCurrentOrg] = useState(false);
  const navigate = useNavigate();

  // Load organizations
  useEffect(() => {
    if (!session?.user) return;

    const loadOrganizations = async () => {
      try {
        setIsLoading(true);
        const orgs = await fetchOrganizations();
        
        if (orgs && orgs.length > 0) {
          setOrganizations(orgs);
          
          // Attempt to load a previously selected organization
          const storedOrgId = localStorage.getItem(STORAGE_KEY);
          if (storedOrgId) {
            const foundOrg = orgs.find(org => org.id === storedOrgId);
            if (foundOrg) {
              setCurrentOrganization(foundOrg);
              loadOrganizationUsers(foundOrg.id);
              checkUserAccess(session.user.id, foundOrg.id);
            } else if (orgs.length > 0) {
              // If stored org wasn't found, select first available org
              setCurrentOrganization(orgs[0]);
              localStorage.setItem(STORAGE_KEY, orgs[0].id);
              loadOrganizationUsers(orgs[0].id);
              checkUserAccess(session.user.id, orgs[0].id);
            }
          } else if (orgs.length > 0) {
            // No stored org, select first available
            setCurrentOrganization(orgs[0]);
            localStorage.setItem(STORAGE_KEY, orgs[0].id);
            loadOrganizationUsers(orgs[0].id);
            checkUserAccess(session.user.id, orgs[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load organizations:", error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrganizations();
  }, [session, sessionLoading]);

  // Create a new organization
  const createOrganization = async (name: string, description?: string, agentId?: string): Promise<string> => {
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      // Create organization with provided fields
      const newOrgData: Omit<Organization, "id" | "createdAt"> = {
        name,
        description,
        agentId,
        ownerId: session.user.id
      };
      
      const newOrgId = await createOrg(newOrgData);

      // Refresh organizations list
      const orgs = await fetchOrganizations();
      setOrganizations(orgs);
      
      // Select the newly created organization
      const newOrg = orgs.find(org => org.id === newOrgId);
      if (newOrg) {
        setCurrentOrganization(newOrg);
        localStorage.setItem(STORAGE_KEY, newOrgId);
        loadOrganizationUsers(newOrgId);
        checkUserAccess(session.user.id, newOrgId);
      }
      
      toast({
        title: "Success", 
        description: "Organization created successfully"
      });
      
      return newOrgId;
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update an organization
  const updateOrganization = async (organization: Organization): Promise<void> => {
    try {
      await updateOrg(organization);
      
      // Update local state
      setOrganizations(orgs => 
        orgs.map(org => org.id === organization.id ? organization : org)
      );
      
      if (currentOrganization?.id === organization.id) {
        setCurrentOrganization(organization);
      }
      
      toast({
        title: "Success", 
        description: "Organization updated successfully"
      });
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error", 
        description: "Failed to update organization",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Delete an organization
  const deleteOrganization = async (organizationId: string): Promise<void> => {
    try {
      await deleteOrg(organizationId);
      
      // Update local state
      setOrganizations(orgs => orgs.filter(org => org.id !== organizationId));
      
      // If deleted org was current, select another
      if (currentOrganization?.id === organizationId) {
        const remainingOrgs = organizations.filter(org => org.id !== organizationId);
        if (remainingOrgs.length > 0) {
          setCurrentOrganization(remainingOrgs[0]);
          localStorage.setItem(STORAGE_KEY, remainingOrgs[0].id);
          loadOrganizationUsers(remainingOrgs[0].id);
          checkUserAccess(session?.user?.id || "", remainingOrgs[0].id);
        } else {
          setCurrentOrganization(null);
          localStorage.removeItem(STORAGE_KEY);
          setUsers([]);
          setUserHasAdminAccessToCurrentOrg(false);
        }
      }
      
      toast({
        title: "Success", 
        description: "Organization deleted successfully"
      });
      
      // Redirect to main dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error", 
        description: "Failed to delete organization",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Change current organization
  const changeOrganization = (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem(STORAGE_KEY, organizationId);
      loadOrganizationUsers(organizationId);
      checkUserAccess(session?.user?.id || "", organizationId);
    }
  };

  // Load organization users
  const loadOrganizationUsers = async (orgId: string) => {
    try {
      if (!orgId) return;
      
      const fetchedUsers = await fetchOrganizationUsers(orgId);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error(`Error loading users for organization ${orgId}:`, error);
      toast({
        title: "Error", 
        description: "Failed to load organization users",
        variant: "destructive"
      });
    }
  };

  // Add a user to organization
  const addUser = async (email: string, role?: string): Promise<void> => {
    try {
      if (!currentOrganization?.id) {
        throw new Error("No organization selected");
      }
      
      await addUserToOrganization(currentOrganization.id, email, role);
      await loadOrganizationUsers(currentOrganization.id);
      
      toast({
        title: "Success", 
        description: "User added successfully"
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Remove a user from organization
  const removeUser = async (userId: string): Promise<void> => {
    try {
      if (!currentOrganization?.id) {
        throw new Error("No organization selected");
      }
      
      await removeUserFromOrganization(currentOrganization.id, userId);
      
      // Update local state
      setUsers(users => users.filter(user => user.id !== userId));
      
      toast({
        title: "Success", 
        description: "User removed successfully"
      });
    } catch (error) {
      console.error("Error removing user:", error);
      toast({
        title: "Error", 
        description: "Failed to remove user",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update a user's role
  const updateUser = async (userId: string, role: string): Promise<void> => {
    try {
      if (!currentOrganization?.id) {
        throw new Error("No organization selected");
      }
      
      // Note: Using supabase directly as there's no updateUserRole function
      const { error } = await supabase
        .from('organization_users')
        .update({ role })
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users => users.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
      
      toast({
        title: "Success", 
        description: "User role updated successfully"
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error", 
        description: "Failed to update user role",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Check if user has admin access to the current organization
  const checkUserAccess = async (userId: string, orgId: string) => {
    try {
      // Check if user is a super admin
      const { data: adminData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (adminData) {
        setUserHasAdminAccessToCurrentOrg(true);
        return;
      }
      
      // Check if user is an admin of this organization
      const { data } = await supabase
        .from('organization_users')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .eq('role', 'admin')
        .maybeSingle();
      
      setUserHasAdminAccessToCurrentOrg(!!data);
    } catch (error) {
      console.error("Error checking user access:", error);
      setUserHasAdminAccessToCurrentOrg(false);
    }
  };

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
}
