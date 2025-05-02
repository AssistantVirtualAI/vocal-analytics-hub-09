
import React, { createContext, ReactNode } from 'react';
import { OrganizationContextType } from './types';
import { useOrganizationState } from './useOrganizationState';

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: null,
  organizations: [],
  users: [],
  changeOrganization: () => {},
  createOrganization: async () => '',
  updateOrganization: async () => {},
  deleteOrganization: async () => {},
  addUserToOrganization: async () => {},
  removeUserFromOrganization: async () => {},
  setUserRole: async () => {},
  fetchOrganizationUsers: async () => {},
  isLoading: true,
});

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const organizationState = useOrganizationState();

  return (
    <OrganizationContext.Provider value={organizationState}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => React.useContext(OrganizationContext);
export { OrganizationContext };
