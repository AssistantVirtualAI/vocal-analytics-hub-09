
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
