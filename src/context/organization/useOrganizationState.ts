
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/auth/useUserSession'; 
import { Organization, OrganizationUser } from '@/types/organization';
import { fetchOrganizations } from '@/services/organization';
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
        // Pass false as the first argument to indicate not admin by default
        // and user ID as second argument
        const orgs = await fetchOrganizations(false, session.user.id);
        
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
        slug: name.toLowerCase().replace(/\s+/g, '-')
      };
      
      // Use direct Supabase call instead of createOrg
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: newOrgData.name,
          description: newOrgData.description,
          agent_id: newOrgData.agentId,
          slug: newOrgData.slug
        }])
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert operation');

      const newOrgId = data.id;

      // Refresh organizations list
      // Pass false as the first argument to indicate not admin by default
      // and user ID as second argument if available
      const orgs = await fetchOrganizations(false, session.user.id);
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
      // Use direct Supabase call instead of updateOrg
      const { error } = await supabase
        .from('organizations')
        .update({
          name: organization.name,
          description: organization.description,
          agent_id: organization.agentId,
          slug: organization.slug
        })
        .eq('id', organization.id);

      if (error) throw error;
      
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
      // Use direct Supabase call instead of deleteOrg
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;
      
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
      
      // Fetch organization users directly from Supabase
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          is_org_admin,
          organization_id,
          profiles:user_id(id, email, display_name, avatar_url)
        `)
        .eq('organization_id', orgId);
      
      if (error) throw error;
      
      if (data) {
        const formattedUsers: OrganizationUser[] = data.map(item => ({
          id: item.user_id,
          email: item.profiles?.email || '',
          displayName: item.profiles?.display_name || '',
          avatarUrl: item.profiles?.avatar_url || '',
          role: item.is_org_admin ? 'admin' : 'user',
          createdAt: new Date().toISOString(), // fallback
          isPending: false
        }));
        
        setUsers(formattedUsers);
      }
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
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (userError) throw userError;
      
      if (!userData) {
        throw new Error(`User with email ${email} not found`);
      }
      
      // Check if user is already in the organization
      const { data: existingMember, error: memberError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userData.id)
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();
        
      if (memberError) throw memberError;
      
      if (existingMember) {
        throw new Error('User is already a member of this organization');
      }
      
      // Add user to organization
      const { error: addError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userData.id,
          organization_id: currentOrganization.id,
          is_org_admin: role === 'admin'
        });
        
      if (addError) throw addError;
      
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
      
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', currentOrganization.id);
        
      if (error) throw error;
      
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
      
      const isAdmin = role === 'admin';
      
      // Update user role
      const { error } = await supabase
        .from('user_organizations')
        .update({ is_org_admin: isAdmin })
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users => users.map(user => 
        user.id === userId ? { ...user, role: role as 'admin' | 'user' } : user
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
        .from('user_organizations')
        .select('is_org_admin')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .maybeSingle();
      
      setUserHasAdminAccessToCurrentOrg(!!data?.is_org_admin);
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
