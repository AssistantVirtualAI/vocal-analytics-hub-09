
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { OrganizationManagementSection } from '@/components/organizations/settings/OrganizationManagementSection';
import { OrganizationUserManagementSection } from '@/components/organizations/settings/OrganizationUserManagementSection';

export default function OrganizationSettings() {
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
  
  // Add debug logging to check organization data
  useEffect(() => {
    console.log('OrganizationSettings - Organizations:', organizations);
    console.log('OrganizationSettings - Current Organization:', currentOrganization);
    console.log('OrganizationSettings - Is Loading:', isLoading);
    console.log('OrganizationSettings - User:', user);
    console.log('OrganizationSettings - Is Admin:', isAdmin);
  }, [organizations, currentOrganization, isLoading, user, isAdmin]);
  
  const handleAddOrganization = async (newOrg: {name: string, agentId: string, description: string}) => {
    console.log('Adding new organization:', newOrg);
    await createOrganization(newOrg, isAdmin, user?.id);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-lg">Chargement des organisations...</div>
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
          <div className="flex flex-col items-center justify-center h-40 space-y-4">
            <div className="text-lg">Aucune organisation trouvée.</div>
            {isAdmin && (
              <button 
                onClick={() => {
                  // Open the organization dialog - simple approach for now
                  const addOrgButton = document.querySelector('[data-testid="add-organization-button"]');
                  if (addOrgButton instanceof HTMLElement) {
                    addOrgButton.click();
                  }
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Créer votre première organisation
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
