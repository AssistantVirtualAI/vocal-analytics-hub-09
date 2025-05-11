
import { z } from 'zod';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  agentId?: string;
  description?: string;
  slug: string;
}

export interface OrganizationUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  createdAt: string;
  isPending: boolean;
}

export const DEFAULT_ORGANIZATION_ID = 'default';
