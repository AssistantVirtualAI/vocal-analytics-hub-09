
import React from 'react';
import { OrganizationManagementSection } from '@/components/organizations/settings/OrganizationManagementSection';
import { OrganizationUserManagementSection } from '@/components/organizations/settings/OrganizationUserManagementSection';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';

export function OrganizationSettings() {
  const { 
    organizations, 
    currentOrganization, 
    changeOrganization, 
    createOrganization, 
    updateOrganization, 
    deleteOrganization, 
    users, 
    fetchOrganizationUsers, 
    addUserToOrganization, 
    removeUserFromOrganization,
    isLoading 
  } = useOrganization();
  const { isAdmin, user } = useAuth();
  
  const handleAddOrganization = async (newOrg: {name: string, agentId: string, description: string}) => {
    console.log('Adding new organization:', newOrg);
    // Create a slug from the organization name (lowercase, replace spaces with hyphens)
    const slug = newOrg.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await createOrganization({...newOrg, slug}, isAdmin, user?.id);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-lg text-blue-600 dark:text-blue-400 animate-pulse">Chargement des organisations...</div>
        </div>
      ) : organizations && organizations.length > 0 ? (
        <>
          <OrganizationManagementSection
            organizations={organizations}
            currentOrganization={currentOrganization}
            isAdmin={isAdmin}
            onAddOrganization={handleAddOrganization}
            onUpdateOrganization={updateOrganization}
            onDeleteOrganization={deleteOrganization}
            onSelectOrganization={changeOrganization}
          />

          <OrganizationUserManagementSection
            currentOrganization={currentOrganization}
            users={users}
            fetchOrganizationUsers={fetchOrganizationUsers}
            addUserToOrganization={addUserToOrganization}
            removeUserFromOrganization={removeUserFromOrganization}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 space-y-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/20 backdrop-blur-sm p-8 rounded-xl border border-blue-200/30 dark:border-blue-800/30 shadow-lg">
          <div className="text-lg text-blue-800 dark:text-blue-200">Aucune organisation trouvée.</div>
          {isAdmin && (
            <button 
              onClick={() => {
                // Open the organization dialog - simple approach for now
                const addOrgButton = document.querySelector('[data-testid="add-organization-button"]');
                if (addOrgButton instanceof HTMLElement) {
                  addOrgButton.click();
                }
              }}
              className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-md shadow-md shadow-blue-500/20 dark:shadow-blue-800/20 transition-all"
            >
              Créer votre première organisation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
