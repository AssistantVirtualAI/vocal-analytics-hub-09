
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrganizationContextType, OrganizationProviderProps } from './types';
import { Organization, OrganizationUser } from '@/types/organization';
import { useOrganizationState } from './useOrganizationState';

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
  userHasAdminAccessToCurrentOrg: false,
});

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const {
    currentOrganization,
    organizations,
    users,
    changeOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addUser,
    removeUser,
    updateUser,
    isLoading,
    userHasAdminAccessToCurrentOrg,
  } = useOrganizationState();

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        users,
        changeOrganization,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        addUser,
        removeUser,
        updateUser,
        isLoading,
        userHasAdminAccessToCurrentOrg,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => useContext(OrganizationContext);
