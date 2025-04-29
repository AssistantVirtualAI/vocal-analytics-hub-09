
import { Organization } from '../types/organization';

// Default organization with the current Agent ID
export const DEFAULT_ORGANIZATION_ID = 'default';

// Initial organizations - in a real app, these would come from a database
export const organizations: Organization[] = [
  {
    id: DEFAULT_ORGANIZATION_ID,
    name: 'Organisation par défaut',
    agentId: 'QNdB45Jpgh06Hr67TzFO', // Using the current Agent ID
    description: 'Organisation créée automatiquement',
    createdAt: new Date().toISOString(),
  }
];

// Get all organizations
export const getOrganizations = (): Organization[] => {
  // In a real app, this would fetch from a database or API
  return organizations;
};

// Get a specific organization by ID
export const getOrganization = (id: string): Organization | undefined => {
  return organizations.find(org => org.id === id);
};

// Get the Agent ID for a specific organization
export const getAgentId = (organizationId: string = DEFAULT_ORGANIZATION_ID): string => {
  const organization = getOrganization(organizationId);
  return organization?.agentId || 'QNdB45Jpgh06Hr67TzFO'; // Fallback to default
};
