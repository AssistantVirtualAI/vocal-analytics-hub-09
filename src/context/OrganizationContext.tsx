
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organization } from '../types/organization';
import { DEFAULT_ORGANIZATION_ID, getOrganization, getOrganizations } from '../config/organizations';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  changeOrganization: (organizationId: string) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: null,
  organizations: [],
  changeOrganization: () => {},
  isLoading: true,
});

export const useOrganization = () => useContext(OrganizationContext);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string>(
    localStorage.getItem('currentOrganizationId') || DEFAULT_ORGANIZATION_ID
  );
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load organizations
    const orgs = getOrganizations();
    setOrganizations(orgs);
    
    // Set current organization
    const org = getOrganization(currentOrganizationId);
    setCurrentOrganization(org || null);
    setIsLoading(false);
  }, [currentOrganizationId]);

  const changeOrganization = (organizationId: string) => {
    localStorage.setItem('currentOrganizationId', organizationId);
    setCurrentOrganizationId(organizationId);
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        changeOrganization,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
