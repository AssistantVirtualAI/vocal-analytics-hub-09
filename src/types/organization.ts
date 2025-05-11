
export * from '@/config/organizations';

// Define the OrganizationUser type for better TypeScript support
export interface OrganizationUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  createdAt: string;
  isPending: boolean;
  isOrgAdmin: boolean;
  isSuperAdmin?: boolean;  // Added this missing property
}
