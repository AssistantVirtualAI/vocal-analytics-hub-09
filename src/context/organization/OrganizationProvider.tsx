
import React, { createContext, useContext } from 'react';
import { OrganizationContextType, OrganizationProviderProps } from './types';
import { useOrganizationState } from './useOrganizationState';
import { Organization } from '@/types/organization';

export const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: null,
  organizations: [],
  users: [],
  changeOrganization: () => {},
  createOrganization: async () => '',
  updateOrganization: async () => {},
  deleteOrganization: async () => {},
  addUser: async () => {},
  removeUser: async () => {},
  updateUser: async () => {},
  isLoading: true,
  error: null,
  loadOrganizations: async () => [], // Added the missing property with correct return type
  userHasAdminAccessToCurrentOrg: false,
});

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const organizationState = useOrganizationState();

  return (
    <OrganizationContext.Provider value={organizationState}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => useContext(OrganizationContext);
