
import { useState, useEffect } from 'react';
import { Organization } from '@/config/organizations';
import { DEFAULT_ORGANIZATION_ID } from '@/config/organizations';

export const useCurrentOrganization = () => {
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string>(
    localStorage.getItem('currentOrganizationId') || DEFAULT_ORGANIZATION_ID
  );
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  const changeOrganization = (organizationId: string) => {
    console.log('[useCurrentOrganization] Changing organization to:', organizationId);
    localStorage.setItem('currentOrganizationId', organizationId);
    setCurrentOrganizationId(organizationId);
  };

  return {
    currentOrganizationId,
    currentOrganization,
    setCurrentOrganization,
    changeOrganization
  };
};
