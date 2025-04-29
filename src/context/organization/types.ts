
import { Organization, OrganizationUser } from '@/types/organization';

export interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  users: OrganizationUser[];
  changeOrganization: (organizationId: string) => void;
  createOrganization: (organization: Omit<Organization, 'id' | 'createdAt'>) => Promise<void>;
  updateOrganization: (organization: Organization) => Promise<void>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  addUserToOrganization: (email: string, organizationId: string) => Promise<void>;
  removeUserFromOrganization: (userId: string, organizationId: string) => Promise<void>;
  setUserRole: (userId: string, role: 'admin' | 'user') => Promise<void>;
  fetchOrganizationUsers: (organizationId: string) => Promise<void>;
  isLoading: boolean;
}
