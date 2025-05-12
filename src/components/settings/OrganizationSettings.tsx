
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/context/organization/OrganizationProvider';
import { OrganizationForm } from '@/components/organizations/settings/OrganizationForm';
import { OrganizationManagementSection } from '@/components/organizations/settings/OrganizationManagementSection';
import { OrganizationUserManagementSection } from '@/components/organizations/settings/OrganizationUserManagementSection';
import { AIHeader } from '@/components/dashboard/AIHeader';
import { DataWrapper } from '@/components/dashboard/DataWrapper';
import { Loader2 } from 'lucide-react';

export function OrganizationSettings() {
  const { 
    currentOrganization, 
    organizations,
    isLoading,
    error,
    loadOrganizations,
    updateOrganization,
    userHasAdminAccessToCurrentOrg,
    users,
    addUser,
    removeUser,
    updateUser,
    deleteOrganization,
    createOrganization,
    changeOrganization
  } = useOrganization();

  const initialLoadPerformed = useRef(false);
  
  // Make sure we only load organizations once on component mount
  useEffect(() => {
    if (!initialLoadPerformed.current) {
      console.log('OrganizationSettings: Initial load of organizations');
      loadOrganizations();
      initialLoadPerformed.current = true;
    }
  }, [loadOrganizations]);

  // Create a handler function that converts the newOrg object to individual parameters
  const handleAddOrganization = async (newOrg: { name: string; agentId: string; description: string; }) => {
    await createOrganization(newOrg.name, newOrg.description, newOrg.agentId);
  };

  return (
    <div className="space-y-6">
      <AIHeader 
        title="Paramètres de l'organisation"
        description="Gérez les paramètres et les membres de votre organisation"
      />

      <DataWrapper isLoading={isLoading} error={error} refetch={loadOrganizations}>
        <OrganizationManagementSection
          organizations={organizations}
          currentOrganization={currentOrganization}
          isAdmin={userHasAdminAccessToCurrentOrg}
          onAddOrganization={handleAddOrganization}
          onUpdateOrganization={updateOrganization}
          onDeleteOrganization={deleteOrganization}
          onSelectOrganization={changeOrganization}
          error={error}
        />
      </DataWrapper>

      {currentOrganization && (
        <OrganizationUserManagementSection 
          currentOrganization={currentOrganization}
          users={users}
          addUserToOrganization={addUser}
          removeUserFromOrganization={removeUser}
          updateUserRole={updateUser}
        />
      )}
    </div>
  );
};
