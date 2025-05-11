
import { Organization, OrganizationUser } from '@/types/organization';

export interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  users: OrganizationUser[];
  changeOrganization: (id: string) => void;
  createOrganization: (org: Omit<Organization, 'id' | 'createdAt'>, isAdmin: boolean, userId?: string) => Promise<string>;
  updateOrganization: (id: string, name: string, description?: string, agentId?: string) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  addUserToOrganization: (email: string, organizationId: string) => Promise<void>;
  removeUserFromOrganization: (userId: string, organizationId: string) => Promise<void>;
  setUserRole: (userId: string, role: 'admin' | 'user') => Promise<void>;
  fetchOrganizationUsers: (organizationId: string) => Promise<void>;
  isLoading: boolean;
  userHasAdminAccessToCurrentOrg: boolean;
}
