
import { Agent } from './index';

export interface Organization {
  id: string;
  name: string;
  agentId: string;
  description?: string;
  createdAt: string;
}

export interface OrganizationWithAgent extends Organization {
  agent?: Agent;
}

export interface OrganizationUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  createdAt: string;
}
