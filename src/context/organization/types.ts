
import { Organization, OrganizationUser } from '@/types/organization';

export interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  users: OrganizationUser[];
  changeOrganization: (organizationId: string) => void;
  createOrganization: (name: string, description?: string, agentId?: string) => Promise<string>;
  updateOrganization: (organization: Organization) => Promise<void>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  addUser: (email: string, role?: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, role: string) => Promise<void>;
  isLoading: boolean;
  error?: Error | null;
  loadOrganizations: () => Promise<Organization[]>;
  userHasAdminAccessToCurrentOrg: boolean;
}

export interface OrganizationProviderProps {
  children: React.ReactNode;
}
